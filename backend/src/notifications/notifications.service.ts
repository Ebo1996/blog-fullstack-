import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(dto: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<NotificationDocument> {
    return this.notificationModel.create({
      userId: new Types.ObjectId(dto.userId),
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data,
    });
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const filter = { userId: new Types.ObjectId(userId) };
    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({ ...filter, isRead: false }),
    ]);
    return { notifications, total, unreadCount };
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { $set: { isRead: true } },
    );
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } },
    );
  }

  // Factory helpers
  async notifyPaymentSuccess(userId: string, eventTitle: string, orderId: string) {
    return this.create({
      userId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Payment successful',
      body: `Your tickets for "${eventTitle}" are ready.`,
      data: { orderId },
    });
  }

  async notifyEventCancelled(userId: string, eventTitle: string, eventId: string) {
    return this.create({
      userId,
      type: NotificationType.EVENT_CANCELLED,
      title: 'Event cancelled',
      body: `"${eventTitle}" has been cancelled.`,
      data: { eventId },
    });
  }

  async notifyTransferReceived(userId: string, senderName: string, ticketId: string) {
    return this.create({
      userId,
      type: NotificationType.TICKET_TRANSFER,
      title: 'Ticket transfer received',
      body: `${senderName} has sent you a ticket. Accept or reject in your dashboard.`,
      data: { ticketId },
    });
  }
}
