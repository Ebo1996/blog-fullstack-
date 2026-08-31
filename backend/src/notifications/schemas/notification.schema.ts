import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  PAYMENT_SUCCESS = 'payment_success',
  TICKET_CREATED = 'ticket_created',
  EVENT_REMINDER = 'event_reminder',
  EVENT_CANCELLED = 'event_cancelled',
  EVENT_UPDATED = 'event_updated',
  TICKET_TRANSFER = 'ticket_transfer',
  TRANSFER_ACCEPTED = 'transfer_accepted',
  RSVP_CONFIRMATION = 'rsvp_confirmation',
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(NotificationType) })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Object })
  data: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
