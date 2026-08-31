import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export interface CreateAuditLogDto {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLogDocument> {
    return this.auditLogModel.create({
      userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
      action: dto.action,
      entityType: dto.entityType,
      entityId: dto.entityId,
      metadata: dto.metadata,
      ipAddress: dto.ipAddress,
    });
  }

  async findAll(page = 1, limit = 50, userId?: string, action?: string) {
    const filter: any = {};
    if (userId) filter.userId = new Types.ObjectId(userId);
    if (action) filter.action = { $regex: action, $options: 'i' };

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name email'),
      this.auditLogModel.countDocuments(filter),
    ]);

    return { logs, total };
  }
}
