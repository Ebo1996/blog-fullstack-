import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, collection: 'auditLogs' })
export class AuditLog {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  action: string;

  @Prop()
  entityType: string;

  @Prop()
  entityId: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  ipAddress: string;

  createdAt: Date;
  updatedAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
