import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../common/decorators/roles.decorator';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ select: false })
  passwordHash: string;

  @Prop({ trim: true })
  image: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.ATTENDEE,
  })
  role: UserRole;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ select: false })
  emailVerificationToken: string;

  @Prop({ select: false })
  passwordResetToken: string;

  @Prop({ select: false })
  passwordResetExpires: Date;

  @Prop({ select: false })
  refreshToken: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt: Date;

  @Prop()
  bio: string;

  @Prop()
  phone: string;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual: id
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.passwordHash = undefined;
    ret.refreshToken = undefined;
    ret.emailVerificationToken = undefined;
    ret.passwordResetToken = undefined;
    ret.passwordResetExpires = undefined;
    ret.__v = undefined;
    return ret;
  },
});
