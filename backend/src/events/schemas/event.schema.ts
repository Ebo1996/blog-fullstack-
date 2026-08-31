import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventDocument = Event & Document;

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum EventType {
  IN_PERSON = 'in_person',
  ONLINE = 'online',
  HYBRID = 'hybrid',
}

@Schema({ _id: false })
class Venue {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  address: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  country: string;

  @Prop()
  lat: number;

  @Prop()
  lng: number;

  @Prop()
  onlineUrl: string;
}

const VenueSchema = SchemaFactory.createForClass(Venue);

@Schema({ timestamps: true, collection: 'events' })
export class Event {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  organizerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', index: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug: string;

  @Prop({ required: true, maxlength: 10000 })
  description: string;

  @Prop()
  shortDescription: string;

  @Prop()
  imageUrl: string;

  @Prop({ type: VenueSchema })
  venue: Venue;

  @Prop({ required: true })
  startAt: Date;

  @Prop({ required: true })
  endAt: Date;

  @Prop({ default: null })
  capacity: number;

  @Prop({
    type: String,
    enum: Object.values(EventStatus),
    default: EventStatus.DRAFT,
    index: true,
  })
  status: EventStatus;

  @Prop({
    type: String,
    enum: Object.values(EventType),
    default: EventType.IN_PERSON,
  })
  type: EventType;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isRsvpOnly: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 'ETB' })
  currency: string;

  @Prop({ default: 0 })
  minPrice: number;

  @Prop({ default: 0 })
  maxPrice: number;

  createdAt: Date;
  updatedAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Indexes
EventSchema.index({ slug: 1 }, { unique: true });
EventSchema.index({ organizerId: 1, status: 1 });
EventSchema.index({ categoryId: 1, status: 1 });
EventSchema.index({ status: 1, startAt: 1 });
EventSchema.index({ status: 1, isFeatured: 1 });
EventSchema.index({ startAt: 1 });
EventSchema.index({ tags: 1 });
EventSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
});

EventSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
EventSchema.set('toJSON', { virtuals: true });
EventSchema.set('toObject', { virtuals: true });
