import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RegistrationDocument = Registration & Document;

@Schema({ timestamps: true, collection: 'registrations' })
export class Registration {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: 'confirmed' })
  status: string;

  createdAt: Date;
  updatedAt: Date;
}

export const RegistrationSchema = SchemaFactory.createForClass(Registration);
// Compound unique index — prevents duplicate RSVP
RegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
RegistrationSchema.index({ userId: 1 });
