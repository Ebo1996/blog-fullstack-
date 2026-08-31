import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketDocument = Ticket & Document;

export enum TicketStatus {
  ACTIVE = 'active',
  USED = 'used',
  CANCELLED = 'cancelled',
  TRANSFERRED = 'transferred',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true, collection: 'tickets' })
export class Ticket {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TicketType', required: true, index: true })
  ticketTypeId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  ticketTypeName: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  ticketCode: string;

  /**
   * qrToken is a random UUID stored only in the DB.
   * The QR code contains ONLY this token — no PII, no prices.
   * The scanner sends this token to the backend which looks it up.
   */
  @Prop({ required: true, unique: true, index: true })
  qrToken: string;

  @Prop({
    type: String,
    enum: Object.values(TicketStatus),
    default: TicketStatus.ACTIVE,
    index: true,
  })
  status: TicketStatus;

  @Prop()
  checkedInAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  checkedInBy: Types.ObjectId;

  @Prop({ default: false })
  isTransferPending: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

// Indexes
TicketSchema.index({ ticketCode: 1 }, { unique: true });
TicketSchema.index({ qrToken: 1 }, { unique: true });
TicketSchema.index({ ownerId: 1, status: 1 });
TicketSchema.index({ eventId: 1, status: 1 });
TicketSchema.index({ orderId: 1 });

TicketSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
TicketSchema.set('toJSON', { virtuals: true });
TicketSchema.set('toObject', { virtuals: true });
