import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Schema({ _id: false })
class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'TicketType', required: true })
  ticketTypeId: Types.ObjectId;

  @Prop({ required: true })
  ticketTypeName: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0 })
  subtotal: number;
}

@Schema({ _id: false })
class PaymentInfo {
  @Prop({ default: 'chapa' })
  provider: string;

  @Prop({ index: true, sparse: true })
  transactionId: string;

  @Prop({ unique: true, sparse: true, index: true })
  checkoutReference: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Prop()
  paidAt: Date;

  @Prop()
  failureReason: string;

  @Prop()
  chapaResponse: string; // stored as JSON string
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
const PaymentInfoSchema = SchemaFactory.createForClass(PaymentInfo);

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  fees: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ default: 'ETB' })
  currency: string;

  @Prop({ type: PaymentInfoSchema })
  payment: PaymentInfo;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    index: true,
  })
  status: OrderStatus;

  @Prop({ default: false })
  ticketsGenerated: boolean;

  @Prop()
  notes: string;

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ eventId: 1, status: 1 });
OrderSchema.index({ 'payment.checkoutReference': 1 }, { unique: true, sparse: true });
OrderSchema.index({ 'payment.transactionId': 1 }, { sparse: true });
OrderSchema.index({ status: 1, createdAt: -1 });

// Expire pending orders after 30 minutes (TTL index on a virtual date)
OrderSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 1800,
    partialFilterExpression: { status: 'pending' },
  },
);

OrderSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });
