import {
  Injectable, Logger, BadRequestException,
  NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { ChapaService } from './chapa/chapa.service';
import { Order, OrderDocument, OrderStatus, PaymentStatus } from '../orders/schemas/order.schema';
import { TicketsService } from '../tickets/tickets.service';
import { ChapaWebhookPayload } from './chapa/chapa.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly chapaService: ChapaService,
    private readonly ticketsService: TicketsService,
    private readonly configService: ConfigService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Server-side payment verification + order fulfillment.
   * Called by the frontend after Chapa redirect.
   * NEVER trusts the frontend's claim of success.
   */
  async verifyAndFulfill(txRef: string, requestingUserId: string) {
    const order = await this.orderModel.findOne({
      'payment.checkoutReference': txRef,
    }).populate('eventId', 'title');

    if (!order) {
      throw new NotFoundException('Order not found for this payment reference');
    }

    if (order.userId.toString() !== requestingUserId) {
      throw new ForbiddenException('Access denied');
    }

    // Already processed — return idempotent result
    if (order.status === OrderStatus.PAID) {
      this.logger.log(`Payment already confirmed for ${txRef} — returning cached result`);
      return { order, alreadyProcessed: true };
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      throw new BadRequestException('This order is no longer active');
    }

    return this.confirmPayment(txRef, order);
  }

  /**
   * Handle incoming Chapa webhook.
   * Validates signature, re-verifies with Chapa, fulfills order.
   * Idempotent: safe to call multiple times for the same txRef.
   */
  async handleWebhook(
    rawBody: string,
    signature: string,
    payload: ChapaWebhookPayload,
  ) {
    // Validate webhook signature
    const isValid = this.chapaService.verifyWebhookSignature(rawBody, signature ?? '');
    if (!isValid) {
      this.logger.error('Invalid Chapa webhook signature — ignoring');
      return;
    }

    const { tx_ref, status } = payload;

    if (status !== 'success') {
      this.logger.log(`Webhook received for ${tx_ref} with status ${status} — skipping`);
      await this.markOrderFailed(tx_ref, `Webhook status: ${status}`);
      return;
    }

    const order = await this.orderModel.findOne({
      'payment.checkoutReference': tx_ref,
    }).populate('eventId', 'title');

    if (!order) {
      this.logger.warn(`Webhook: no order found for tx_ref ${tx_ref}`);
      return;
    }

    // Idempotency: already processed
    if (order.status === OrderStatus.PAID) {
      this.logger.log(`Webhook: order already paid for ${tx_ref} — skipping duplicate`);
      return;
    }

    await this.confirmPayment(tx_ref, order);
  }

  /**
   * Core fulfillment logic wrapped in a MongoDB transaction.
   * 1. Re-verify with Chapa API (skip for free orders)
   * 2. Update order status
   * 3. Generate tickets
   * All in one atomic operation.
   */
  async confirmPayment(txRefOrOrderId: string, existingOrder?: OrderDocument) {
    // Find order if not provided
    const order = existingOrder || await this.orderModel.findOne({
      $or: [
        { 'payment.checkoutReference': txRefOrOrderId },
        { _id: Types.ObjectId.isValid(txRefOrOrderId) ? new Types.ObjectId(txRefOrOrderId) : null },
      ],
    }).populate('eventId', 'title organizerId');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const txRef = order.payment?.checkoutReference || txRefOrOrderId;
    const isFreeOrder = order.totalAmount === 0;

    // Idempotency check: if order is already PAID and tickets are generated, return early
    if (order.status === OrderStatus.PAID && order.ticketsGenerated) {
      this.logger.log(`[PaymentsService] Order ${order._id} already processed - returning cached result`);
      return { order, alreadyProcessed: true };
    }

    // Additional safety check: if status is PAID but ticketsGenerated is false, something went wrong
    if (order.status === OrderStatus.PAID && !order.ticketsGenerated) {
      this.logger.warn(`[PaymentsService] Order ${order._id} is PAID but tickets not generated - will regenerate`);
    }

    let verification: any = null;

    // For paid orders, always re-verify with Chapa
    if (!isFreeOrder) {
      verification = await this.chapaService.verify(txRef);

      if (verification.data.status !== 'success') {
        await this.markOrderFailed(txRef, `Chapa verify status: ${verification.data.status}`);
        throw new BadRequestException('Payment was not successful');
      }

      // Verify amount matches what was ordered (prevent price tampering)
      const verifiedAmount = parseFloat(verification.data.amount);
      const tolerance = 0.01;
      if (Math.abs(verifiedAmount - order.totalAmount) > tolerance) {
        this.logger.error(
          `Amount mismatch for ${txRef}: expected ${order.totalAmount}, got ${verifiedAmount}`,
        );
        await this.markOrderFailed(txRef, 'Amount mismatch');
        throw new BadRequestException('Payment amount does not match order amount');
      }
    } else {
      this.logger.log(`[PaymentsService] Processing free order ${order._id}`);
    }

    // MongoDB transaction: update order + create tickets atomically
    const session = await this.connection.startSession();
    let result: any;

    try {
      await session.withTransaction(async () => {
        // Mark order as paid (inside transaction)
        const updateData: any = {
          status: OrderStatus.PAID,
          ticketsGenerated: false,
          'payment.status': PaymentStatus.SUCCESS,
          'payment.paidAt': new Date(),
        };

        // Only add Chapa-specific fields for paid orders
        if (!isFreeOrder && verification) {
          updateData['payment.transactionId'] = verification.data.reference;
          updateData['payment.chapaResponse'] = JSON.stringify(verification.data);
        }

        const paid = await this.orderModel.findByIdAndUpdate(
          order._id,
          { $set: updateData },
          { new: true, session },
        );

        if (!paid) throw new Error('Failed to update order status');

        // Generate tickets inside the same transaction
        const tickets = await this.ticketsService.generateForOrder(paid, session);

        // Mark tickets generated
        await this.orderModel.findByIdAndUpdate(
          order._id,
          { $set: { ticketsGenerated: true } },
          { session },
        );

        result = { order: paid, tickets };
      });
    } finally {
      await session.endSession();
    }

    // ── Notifications (outside transaction — best effort) ──────────
    const eventTitle = (order as any).eventId?.title ?? 'your event';
    const organizerId = (order as any).eventId?.organizerId;
    const buyerName = (order as any).userId?.name || 'A customer';
    const totalTickets = order.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Notify buyer
    this.notificationsService.notifyPaymentSuccess(
      order.userId.toString(),
      eventTitle,
      order._id.toString(),
    ).catch((e) => this.logger.error(`Notification failed: ${e.message}`));

    // Notify organizer
    if (organizerId) {
      const orgIdStr = typeof organizerId === 'object' ? organizerId._id?.toString() || organizerId.toString() : organizerId.toString();
      this.notificationsService.notifyOrganizerNewSale(
        orgIdStr,
        eventTitle,
        totalTickets,
        buyerName,
      ).catch((e) => this.logger.error(`Organizer notification failed: ${e.message}`));
    }

    // ── Audit log (outside transaction — best effort) ──────────────
    this.auditLogsService.log({
      userId: order.userId.toString(),
      action: 'payment.confirmed',
      entityType: 'Order',
      entityId: order._id.toString(),
      metadata: { txRef, amount: order.totalAmount },
    }).catch((e) => this.logger.error(`Audit log failed: ${e.message}`));

    return result;
  }

  private async markOrderFailed(txRef: string, reason: string) {
    await this.orderModel.findOneAndUpdate(
      { 'payment.checkoutReference': txRef, status: OrderStatus.PENDING },
      {
        $set: {
          status: OrderStatus.FAILED,
          'payment.status': PaymentStatus.FAILED,
          'payment.failureReason': reason,
        },
      },
    );
  }
}
