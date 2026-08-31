import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransferDocument = Transfer & Document;

export enum TransferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true, collection: 'ticketTransfers' })
export class Transfer {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ticket', required: true, index: true })
  ticketId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  fromUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  toUserId: Types.ObjectId;

  @Prop({ required: true, lowercase: true })
  toEmail: string;

  @Prop({
    type: String,
    enum: Object.values(TransferStatus),
    default: TransferStatus.PENDING,
  })
  status: TransferStatus;

  @Prop()
  expiresAt: Date;

  @Prop()
  acceptedAt: Date;

  @Prop()
  message: string;

  createdAt: Date;
  updatedAt: Date;
}

export const TransferSchema = SchemaFactory.createForClass(Transfer);
TransferSchema.index({ ticketId: 1 });
TransferSchema.index({ toUserId: 1, status: 1 });
TransferSchema.index({ fromUserId: 1 });
TransferSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { status: 'pending' } },
);
