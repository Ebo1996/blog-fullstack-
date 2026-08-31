import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true, maxlength: 500 })
  description: string;

  @Prop({ trim: true })
  icon: string;

  @Prop({ trim: true })
  imageUrl: string;

  @Prop({ default: '#6366f1' })
  color: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ isActive: 1, sortOrder: 1 });
