import {
  Injectable, NotFoundException, BadRequestException,
  ForbiddenException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Transfer, TransferDocument, TransferStatus } from './schemas/transfer.schema';
import { TicketsService } from '../tickets/tickets.service';
import { UsersService } from '../users/users.service';
import { TicketStatus } from '../tickets/schemas/ticket.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { IsEmail, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiateTransferDto {
  @ApiProperty() @IsMongoId() ticketId: string;
  @ApiProperty() @IsEmail() recipientEmail: string;
  @ApiPropertyOptional() @IsOptional() @IsString() message?: string;
}

@Injectable()
export class TransfersService {
  constructor(
    @InjectModel(Transfer.name) private readonly transferModel: Model<TransferDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly ticketsService: TicketsService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async initiate(fromUserId: string, dto: InitiateTransferDto): Promise<TransferDocument> {
    console.log(`[TransfersService] Initiating transfer from user ${fromUserId} to ${dto.recipientEmail}`);
    
    const ticket = await this.ticketsService.findById(dto.ticketId);
    console.log(`[TransfersService] Ticket found: ${ticket._id}, owner: ${ticket.ownerId}`);

    // Ownership check - handle populated ownerId
    const ownerId = typeof ticket.ownerId === 'object' && ticket.ownerId?._id 
      ? ticket.ownerId._id.toString() 
      : ticket.ownerId.toString();
    
    if (ownerId !== fromUserId) {
      console.log(`[TransfersService] Ownership check failed: ${ownerId} !== ${fromUserId}`);
      throw new ForbiddenException('You do not own this ticket');
    }
    console.log(`[TransfersService] Ownership verified`);


    // Status checks
    if (ticket.status !== TicketStatus.ACTIVE) {
      console.log(`[TransfersService] Ticket status is ${ticket.status}, cannot transfer`);
      throw new BadRequestException(`Cannot transfer a ${ticket.status} ticket`);
    }

    if (ticket.isTransferPending) {
      console.log(`[TransfersService] Transfer already pending for this ticket`);
      throw new ConflictException('A transfer for this ticket is already pending');
    }

    // Can't transfer to yourself
    const sender = await this.usersService.findById(fromUserId);
    if (sender.email.toLowerCase() === dto.recipientEmail.toLowerCase()) {
      console.log(`[TransfersService] Cannot transfer to yourself`);
      throw new BadRequestException('Cannot transfer a ticket to yourself');
    }

    // Recipient must have an account
    console.log(`[TransfersService] Looking up recipient: ${dto.recipientEmail}`);
    const recipient = await this.usersService.findByEmail(dto.recipientEmail);
    if (!recipient) {
      console.log(`[TransfersService] Recipient not found: ${dto.recipientEmail}`);
      throw new NotFoundException('Recipient account not found. They must register first.');
    }
    console.log(`[TransfersService] Recipient found: ${recipient._id} (${recipient.email})`);

    // Check no pending transfer already exists
    console.log(`[TransfersService] Checking for existing pending transfers`);
    const existingPending = await this.transferModel.findOne({
      ticketId: new Types.ObjectId(dto.ticketId),
      status: TransferStatus.PENDING,
    });
    if (existingPending) {
      console.log(`[TransfersService] Pending transfer already exists: ${existingPending._id}`);
      throw new ConflictException('A pending transfer already exists for this ticket');
    }

    // Mark ticket as transfer-pending
    await this.ticketsService.setTransferPending(dto.ticketId, true);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log(`[TransfersService] Creating transfer record`);
    const transfer = await this.transferModel.create({
      ticketId: new Types.ObjectId(dto.ticketId),
      fromUserId: new Types.ObjectId(fromUserId),
      toUserId: recipient._id,
      toEmail: dto.recipientEmail.toLowerCase(),
      message: dto.message,
      expiresAt,
      status: TransferStatus.PENDING,
    });
    console.log(`[TransfersService] Transfer created successfully: ${transfer._id}`);

    // Notify recipient (best effort)
    this.notificationsService.notifyTransferReceived(
      recipient._id.toString(),
      sender.name,
      dto.ticketId,
    ).catch((err) => {
      console.log(`[TransfersService] Failed to send notification:`, err.message);
    });

    return transfer;
  }

  async accept(transferId: string, acceptingUserId: string): Promise<TransferDocument> {
    const transfer = await this.transferModel.findById(transferId);
    if (!transfer) throw new NotFoundException('Transfer not found');

    if (transfer.toUserId.toString() !== acceptingUserId) {
      throw new ForbiddenException('Only the recipient can accept this transfer');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(`Transfer is already ${transfer.status}`);
    }

    if (new Date() > transfer.expiresAt) {
      await this.expire(transferId);
      throw new BadRequestException('This transfer has expired');
    }

    // Atomic: change ownership + update transfer status
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.ticketsService.markTransferred(
          transfer.ticketId.toString(),
          acceptingUserId,
          session,
        );

        await this.transferModel.findByIdAndUpdate(
          transferId,
          { $set: { status: TransferStatus.ACCEPTED, acceptedAt: new Date() } },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    // Notify sender that transfer was accepted (best effort)
    this.notificationsService.create({
      userId: transfer.fromUserId.toString(),
      type: 'transfer_accepted' as any,
      title: 'Transfer accepted',
      body: 'Your ticket transfer has been accepted.',
      data: { transferId },
    }).catch(() => {});

    return (await this.transferModel.findById(transferId)) as TransferDocument;
  }

  async reject(transferId: string, rejectingUserId: string): Promise<TransferDocument> {
    const transfer = await this.transferModel.findById(transferId);
    if (!transfer) throw new NotFoundException('Transfer not found');

    if (transfer.toUserId.toString() !== rejectingUserId) {
      throw new ForbiddenException('Only the recipient can reject this transfer');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(`Transfer is already ${transfer.status}`);
    }

    await this.ticketsService.setTransferPending(transfer.ticketId.toString(), false);

    return (await this.transferModel.findByIdAndUpdate(
      transferId,
      { $set: { status: TransferStatus.REJECTED } },
      { new: true },
    )) as TransferDocument;
  }

  async cancel(transferId: string, cancellingUserId: string): Promise<TransferDocument> {
    const transfer = await this.transferModel.findById(transferId);
    if (!transfer) throw new NotFoundException('Transfer not found');

    if (transfer.fromUserId.toString() !== cancellingUserId) {
      throw new ForbiddenException('Only the sender can cancel this transfer');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(`Transfer is already ${transfer.status}`);
    }

    await this.ticketsService.setTransferPending(transfer.ticketId.toString(), false);

    return (await this.transferModel.findByIdAndUpdate(
      transferId,
      { $set: { status: TransferStatus.CANCELLED } },
      { new: true },
    )) as TransferDocument;
  }

  private async expire(transferId: string): Promise<void> {
    const transfer = await this.transferModel.findById(transferId);
    if (!transfer) return;
    await this.ticketsService.setTransferPending(transfer.ticketId.toString(), false);
    await this.transferModel.findByIdAndUpdate(transferId, {
      $set: { status: TransferStatus.EXPIRED },
    });
  }

  async findByUser(userId: string) {
    return this.transferModel
      .find({
        $or: [
          { fromUserId: new Types.ObjectId(userId) },
          { toUserId: new Types.ObjectId(userId) },
        ],
      })
      .sort({ createdAt: -1 })
      .populate('ticketId', 'ticketCode ticketTypeName')
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email');
  }

  async findPendingForUser(userId: string) {
    return this.transferModel
      .find({ toUserId: new Types.ObjectId(userId), status: TransferStatus.PENDING })
      .populate('ticketId', 'ticketCode ticketTypeName')
      .populate('fromUserId', 'name email');
  }
}
