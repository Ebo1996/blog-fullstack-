import {
  Injectable, NotFoundException, BadRequestException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Order, OrderDocument, OrderStatus, PaymentStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { TicketTypesService } from '../ticket-types/ticket-types.service';
import { EventsService } from '../events/events.service';
import { ChapaService } from '../payments/chapa/chapa.service';
import { UsersService } from '../users/users.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getPaginationMeta } from '../common/dto/pagination.dto';
import { generateOrderReference } from '../common/utils/slug.util';
import { EventStatus } from '../events/schemas/event.schema';

const PLATFORM_FEE_PERCENT = 0.025; // 2.5%

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly ticketTypesService: TicketTypesService,
    private readonly eventsService: EventsService,
    private readonly chapaService: ChapaService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Full order creation + Chapa initialization.
   * Steps:
   * 1. Validate event is published and accepting purchases
   * 2. Validate all ticket types belong to event
   * 3. Backend-calculate all prices (never trust frontend)
   * 4. Reserve inventory inside MongoDB transaction
   * 5. Create pending order
   * 6. Initialize Chapa — return checkout URL
   */
  async createAndInitialize(userId: string, dto: CreateOrderDto) {
    // 1. Validate event
    const event = await this.eventsService.findById(dto.eventId);
    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('This event is not accepting ticket purchases');
    }
    if (new Date(event.endAt) < new Date()) {
      throw new BadRequestException('This event has already ended');
    }

    // 2. Load and validate all ticket types + backend-calculate totals
    let subtotal = 0;
    const resolvedItems: {
      ticketTypeId: Types.ObjectId;
      ticketTypeName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[] = [];

    for (const item of dto.items) {
      const tt = await this.ticketTypesService.findById(item.ticketTypeId);

      if (tt.eventId.toString() !== dto.eventId) {
        throw new BadRequestException(
          `Ticket type ${item.ticketTypeId} does not belong to this event`,
        );
      }

      if (tt.status !== 'active') {
        throw new BadRequestException(`Ticket type "${tt.name}" is not available`);
      }

      // Check sales window
      const now = new Date();
      if (tt.salesStartAt && now < new Date(tt.salesStartAt)) {
        throw new BadRequestException(`Sales for "${tt.name}" have not started yet`);
      }
      if (tt.salesEndAt && now > new Date(tt.salesEndAt)) {
        throw new BadRequestException(`Sales for "${tt.name}" have ended`);
      }

      // Validate per-order limits
      if (item.quantity < tt.minPerOrder || item.quantity > tt.maxPerOrder) {
        throw new BadRequestException(
          `"${tt.name}" allows ${tt.minPerOrder}–${tt.maxPerOrder} tickets per order`,
        );
      }

      const itemSubtotal = tt.price * item.quantity;
      subtotal += itemSubtotal;

      resolvedItems.push({
        ticketTypeId: new Types.ObjectId(item.ticketTypeId),
        ticketTypeName: tt.name,
        quantity: item.quantity,
        unitPrice: tt.price,   // Price from DB — not from frontend
        subtotal: itemSubtotal,
      });
    }

    const fees = Math.round(subtotal * PLATFORM_FEE_PERCENT * 100) / 100;
    const totalAmount = subtotal + fees;
    const txRef = generateOrderReference();

    // Check if this is a free order (0 ETB)
    const isFreeOrder = totalAmount === 0;

    // 3. Reserve inventory + create order atomically
    const session = await this.connection.startSession();
    let order: OrderDocument | undefined;

    try {
      await session.withTransaction(async () => {
        // Reserve inventory for each item (atomic, prevents overselling)
        for (const item of resolvedItems) {
          await this.ticketTypesService.reserveInventory(
            item.ticketTypeId.toString(),
            item.quantity,
            session,
          );
        }

        // Create order - for free orders, set status to PAID immediately
        const [created] = await this.orderModel.create(
          [
            {
              userId: new Types.ObjectId(userId),
              eventId: new Types.ObjectId(dto.eventId),
              items: resolvedItems,
              subtotal,
              fees,
              totalAmount,
              currency: event.currency ?? 'ETB',
              notes: dto.notes,
              status: isFreeOrder ? OrderStatus.PAID : OrderStatus.PENDING,
              payment: {
                provider: isFreeOrder ? 'free' : 'chapa',
                checkoutReference: txRef,
                status: isFreeOrder ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
                paidAt: isFreeOrder ? new Date() : undefined,
              },
            },
          ],
          { session },
        );
        order = created;
      });
    } finally {
      await session.endSession();
    }

    if (!order) throw new Error('Order creation failed inside transaction');

    // Audit log for order creation
    this.auditLogsService.log({
      userId,
      action: 'order.created',
      entityType: 'Order',
      entityId: order._id.toString(),
      metadata: { eventId: dto.eventId, totalAmount, txRef, isFree: isFreeOrder },
    }).catch(() => {});

    // For free orders, skip Chapa and return success immediately
    if (isFreeOrder) {
      this.logger.log(`[OrdersService] Free order ${order._id} created, tickets will be generated by webhook handler`);
      
      return {
        order,
        checkoutUrl: null, // No checkout needed for free tickets
        txRef,
        isFree: true,
        message: 'Free tickets obtained successfully',
      };
    }

    // 4. Initialize Chapa payment (outside transaction — network call) for paid orders
    const user = await this.usersService.findById(userId);
    const nameParts = user.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '-';

    const callbackUrl = this.configService.get<string>('CHAPA_CALLBACK_URL') ?? '';
    const returnUrl = `${this.configService.get<string>('CHAPA_RETURN_URL') ?? 'http://localhost:3000/payment/success'}?tx_ref=${txRef}`;

    const chapaResponse = await this.chapaService.initialize({
      amount: totalAmount.toString(),
      currency: order.currency,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      tx_ref: txRef,
      callback_url: callbackUrl,
      return_url: returnUrl,
      customization: {
        title: 'Event Tickets',
        description: txRef,
      },
    });

    return {
      order,
      checkoutUrl: chapaResponse.data.checkout_url,
      txRef,
      isFree: false,
    };
  }

  async findById(id: string, userId: string, isAdmin = false): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Order not found');
    const order = await this.orderModel
      .findById(id)
      .populate('eventId', 'title slug imageUrl startAt venue')
      .populate('userId', 'name email');

    if (!order) throw new NotFoundException('Order not found');

    if (!isAdmin && order.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async findByUser(
    userId: string,
    page = 1,
    limit = 20,
    status?: OrderStatus,
  ) {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('eventId', 'title slug imageUrl startAt venue'),
      this.orderModel.countDocuments(filter),
    ]);

    return { orders, meta: getPaginationMeta(total, page, limit) };
  }

  async findByEvent(
    eventId: string,
    organizerId: string,
    page = 1,
    limit = 20,
    isAdmin = false,
  ) {
    const event = await this.eventsService.findById(eventId);
    const ownerId = (event.organizerId as any)?._id || event.organizerId;
    if (!isAdmin && ownerId.toString() !== organizerId) {
      throw new ForbiddenException('Access denied');
    }

    const filter = { eventId: new Types.ObjectId(eventId) };
    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name email'),
      this.orderModel.countDocuments(filter),
    ]);

    return { orders, meta: getPaginationMeta(total, page, limit) };
  }

  // Cancel a pending order and release inventory
  async cancel(id: string, userId: string, isAdmin = false): Promise<OrderDocument> {
    const order = await this.findById(id, userId, isAdmin);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        // Release inventory
        for (const item of order.items) {
          await this.ticketTypesService.releaseInventory(
            item.ticketTypeId.toString(),
            item.quantity,
            session,
          );
        }

        await this.orderModel.findByIdAndUpdate(
          order._id,
          { $set: { status: OrderStatus.CANCELLED } },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    return this.findById(id, userId, isAdmin);
  }
}
