import {
  Injectable, NotFoundException, ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { Ticket, TicketDocument, TicketStatus } from './schemas/ticket.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { getPaginationMeta } from '../common/dto/pagination.dto';
import { generateTicketCode } from '../common/utils/slug.util';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
  ) {}

  /**
   * Generate tickets for a paid order.
   * Called inside a MongoDB transaction from PaymentsService.
   * Creates one ticket per quantity per order item.
   */
  async generateForOrder(
    order: OrderDocument,
    session: ClientSession,
  ): Promise<TicketDocument[]> {
    const tickets: any[] = [];

    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i++) {
        tickets.push({
          eventId: order.eventId,
          orderId: order._id,
          ticketTypeId: item.ticketTypeId,
          ticketTypeName: item.ticketTypeName,
          ownerId: order.userId,
          ticketCode: generateTicketCode(),
          qrToken: uuidv4(), // Secure random token — no PII inside
          status: TicketStatus.ACTIVE,
        });
      }
    }

    const created = await this.ticketModel.insertMany(tickets, { session });
    this.logger.log(
      `Generated ${created.length} tickets for order ${order._id.toString()}`,
    );
    return created as TicketDocument[];
  }

  /**
   * Get QR code as a data URL for a ticket.
   * The QR encodes ONLY the qrToken — nothing else.
   */
  async getQrDataUrl(ticketId: string, requestingUserId: string): Promise<string> {
    const ticket = await this.findById(ticketId, requestingUserId);
    // QR content is just the token — scanner sends it to the backend
    return QRCode.toDataURL(ticket.qrToken, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: { dark: '#151512', light: '#ffffff' },
    });
  }

  async findById(id: string, requestingUserId?: string): Promise<TicketDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Ticket not found');
    const ticket = await this.ticketModel
      .findById(id)
      .populate('eventId', 'title slug imageUrl startAt endAt venue')
      .populate('ticketTypeId', 'name price currency')
      .populate('ownerId', 'name email');

    if (!ticket) throw new NotFoundException('Ticket not found');

    if (requestingUserId) {
      // ownerId is populated, so we need to access _id
      const ownerIdStr = (ticket.ownerId as any)?._id?.toString() || ticket.ownerId.toString();
      if (ownerIdStr !== requestingUserId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return ticket;
  }

  async findByToken(qrToken: string): Promise<TicketDocument | null> {
    return this.ticketModel
      .findOne({ qrToken })
      .populate('eventId', 'title startAt endAt venue')
      .populate('ticketTypeId', 'name')
      .populate('ownerId', 'name email');
  }

  async findByOwner(
    ownerId: string,
    page = 1,
    limit = 20,
    status?: TicketStatus,
  ) {
    const filter: any = { ownerId: new Types.ObjectId(ownerId) };
    if (status) filter.status = status;

    const [tickets, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('eventId', 'title slug imageUrl startAt endAt venue status')
        .populate('ticketTypeId', 'name price currency'),
      this.ticketModel.countDocuments(filter),
    ]);

    return { tickets, meta: getPaginationMeta(total, page, limit) };
  }

  async findByEvent(
    eventId: string,
    organizerId: string,
    isAdmin: boolean,
    page = 1,
    limit = 100,
  ) {
    // Verify the organizer owns this event (unless admin)
    if (!isAdmin) {
      const Event = this.ticketModel.db.model('Event');
      const event: any = await Event.findById(eventId).lean();
      if (!event) throw new NotFoundException('Event not found');
      
      // Handle both populated and non-populated organizerId
      let eventOrganizerId: string;
      if (typeof event.organizerId === 'object' && event.organizerId !== null) {
        eventOrganizerId = event.organizerId._id?.toString() || event.organizerId.toString();
      } else {
        eventOrganizerId = event.organizerId?.toString();
      }
      
      if (eventOrganizerId !== organizerId) {
        throw new ForbiddenException('Access denied');
      }
    }

    const filter: any = { eventId: new Types.ObjectId(eventId), status: { $ne: TicketStatus.CANCELLED } };

    const [tickets, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('ownerId', 'name email')
        .populate('ticketTypeId', 'name price')
        .lean(),
      this.ticketModel.countDocuments(filter),
    ]);

    return { tickets, meta: getPaginationMeta(total, page, limit) };
  }

  async findByOrder(orderId: string): Promise<TicketDocument[]> {
    return this.ticketModel
      .find({ orderId: new Types.ObjectId(orderId) })
      .populate('ticketTypeId', 'name price');
  }

  async cancel(ticketId: string, session?: ClientSession): Promise<void> {
    await this.ticketModel.findByIdAndUpdate(
      ticketId,
      { $set: { status: TicketStatus.CANCELLED } },
      { session },
    );
  }

  async markTransferred(ticketId: string, newOwnerId: string, session: ClientSession): Promise<void> {
    await this.ticketModel.findByIdAndUpdate(
      ticketId,
      {
        $set: {
          ownerId: new Types.ObjectId(newOwnerId),
          status: TicketStatus.ACTIVE,
          isTransferPending: false,
        },
      },
      { session },
    );
  }

  async setTransferPending(ticketId: string, pending: boolean): Promise<void> {
    await this.ticketModel.findByIdAndUpdate(ticketId, {
      $set: { isTransferPending: pending },
    });
  }
}
