import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CheckInDocument = CheckIn & Document;

@Schema({ timestamps: true, collection: 'checkIns' })
export class CheckIn {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ticket', required: true, index: true })
  ticketId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  attendeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  scannedBy: Types.ObjectId;

  @Prop({ required: true })
  checkedInAt: Date;

  @Prop()
  deviceInfo: string;

  createdAt: Date;
  updatedAt: Date;
}

export const CheckInSchema = SchemaFactory.createForClass(CheckIn);
CheckInSchema.index({ ticketId: 1 }, { unique: true }); // one check-in per ticket
CheckInSchema.index({ eventId: 1, checkedInAt: -1 });
