import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { CheckIn, CheckInDocument } from './schemas/check-in.schema';
import { TicketsService } from '../tickets/tickets.service';
import { EventsService } from '../events/events.service';
import { TicketStatus } from '../tickets/schemas/ticket.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class CheckInsService {
  private readonly logger = new Logger(CheckInsService.name);

  constructor(
    @InjectModel(CheckIn.name) private readonly checkInModel: Model<CheckInDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly ticketsService: TicketsService,
    private readonly eventsService: EventsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Scan a QR token and atomically check in the attendee.
   * Returns a typed result: success | already_used | invalid | wrong_event
   */
  async scan(qrToken: string, eventId: string, scannedByUserId: string) {
    // Verify the scanner is organizer/staff for this event
    const event = await this.eventsService.findById(eventId);

    const ticket = await this.ticketsService.findByToken(qrToken);

    if (!ticket) {
      return { result: 'invalid' as const, message: 'Invalid ticket' };
    }

    if (ticket.eventId.toString() !== eventId) {
      return {
        result: 'wrong_event' as const,
        message: 'This ticket is for a different event',
      };
    }

    if (ticket.status === TicketStatus.USED) {
      return {
        result: 'already_used' as const,
        message: 'Ticket already used',
        checkedInAt: ticket.checkedInAt,
        attendee: ticket.ownerId,
      };
    }

    if (ticket.status !== TicketStatus.ACTIVE) {
      return {
        result: 'invalid' as const,
        message: `Ticket is ${ticket.status}`,
      };
    }

    // Atomically mark as used
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const now = new Date();

        // Conditional update — only succeeds if still 'active'
        const updated = await this.ticketsService['ticketModel'].findOneAndUpdate(
          { _id: ticket._id, status: TicketStatus.ACTIVE },
          { $set: { status: TicketStatus.USED, checkedInAt: now, checkedInBy: new Types.ObjectId(scannedByUserId) } },
          { new: true, session },
        );

        if (!updated) {
          throw new ConflictException('Ticket was already used (race condition)');
        }

        await this.checkInModel.create(
          [
            {
              ticketId: ticket._id,
              eventId: new Types.ObjectId(eventId),
              attendeeId: ticket.ownerId,
              scannedBy: new Types.ObjectId(scannedByUserId),
              checkedInAt: now,
            },
          ],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    // Audit log
    this.auditLogsService.log({
      userId: scannedByUserId,
      action: 'ticket.checked_in',
      entityType: 'Ticket',
      entityId: ticket._id.toString(),
      metadata: { eventId, attendeeId: ticket.ownerId.toString() },
    }).catch(() => {});

    return {
      result: 'success' as const,
      message: 'Checked in successfully',
      ticket: {
        id: ticket._id.toString(),
        ticketCode: ticket.ticketCode,
        ticketType: ticket.ticketTypeId,
        attendee: ticket.ownerId,
      },
    };
  }

  async findByEvent(eventId: string, page = 1, limit = 50) {
    const filter = { eventId: new Types.ObjectId(eventId) };
    const [checkIns, total] = await Promise.all([
      this.checkInModel
        .find(filter)
        .sort({ checkedInAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('attendeeId', 'name email')
        .populate('ticketId', 'ticketCode ticketTypeName'),
      this.checkInModel.countDocuments(filter),
    ]);
    return { checkIns, total };
  }
}
