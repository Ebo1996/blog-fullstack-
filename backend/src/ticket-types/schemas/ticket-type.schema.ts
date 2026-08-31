import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketTypeDocument = TicketType & Document;

export enum TicketTypeStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  SOLD_OUT = 'sold_out',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true, collection: 'ticketTypes' })
export class TicketType {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ trim: true, maxlength: 500 })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 'ETB' })
  currency: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ default: 0, min: 0 })
  soldQuantity: number;

  @Prop()
  salesStartAt: Date;

  @Prop()
  salesEndAt: Date;

  @Prop({
    type: String,
    enum: Object.values(TicketTypeStatus),
    default: TicketTypeStatus.ACTIVE,
  })
  status: TicketTypeStatus;

  @Prop({ default: 1 })
  minPerOrder: number;

  @Prop({ default: 10 })
  maxPerOrder: number;

  @Prop({ default: false })
  isTransferable: boolean;

  @Prop({ default: true })
  isRefundable: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const TicketTypeSchema = SchemaFactory.createForClass(TicketType);

TicketTypeSchema.index({ eventId: 1 });
TicketTypeSchema.index({ eventId: 1, status: 1 });

// Virtual: availableQuantity
TicketTypeSchema.virtual('availableQuantity').get(function () {
  return Math.max(0, this.quantity - this.soldQuantity);
});

TicketTypeSchema.virtual('isSoldOut').get(function () {
  return this.soldQuantity >= this.quantity;
});

TicketTypeSchema.set('toJSON', { virtuals: true });
TicketTypeSchema.set('toObject', { virtuals: true });
