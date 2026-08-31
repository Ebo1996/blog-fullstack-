import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Event, EventDocument } from '../events/schemas/event.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { UsersService } from '../users/users.service';
import { EventsService } from '../events/events.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UserRole } from '../common/decorators/roles.decorator';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly usersService: UsersService,
    private readonly eventsService: EventsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // ── Users ──────────────────────────────────────────────────────
  async listUsers(page = 1, limit = 20, role?: UserRole, search?: string) {
    return this.usersService.findAll(page, limit, role, search);
  }

  async suspendUser(adminId: string, userId: string): Promise<UserDocument> {
    const user = await this.usersService.setActive(userId, false);
    await this.auditLogsService.log({
      userId: adminId,
      action: 'admin.user.suspended',
      entityType: 'User',
      entityId: userId,
    });
    return user;
  }

  async unsuspendUser(adminId: string, userId: string): Promise<UserDocument> {
    const user = await this.usersService.setActive(userId, true);
    await this.auditLogsService.log({
      userId: adminId,
      action: 'admin.user.unsuspended',
      entityType: 'User',
      entityId: userId,
    });
    return user;
  }

  async updateUserRole(adminId: string, userId: string, role: UserRole): Promise<UserDocument> {
    const user = await this.usersService.updateRole(userId, role);
    await this.auditLogsService.log({
      userId: adminId,
      action: 'admin.user.role_changed',
      entityType: 'User',
      entityId: userId,
      metadata: { newRole: role },
    });
    return user;
  }

  // ── Events ─────────────────────────────────────────────────────
  async listEvents(page = 1, limit = 20, status?: string) {
    const filter: any = {};
    if (status) filter.status = status;

    const [events, total] = await Promise.all([
      this.eventModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('organizerId', 'name email')
        .populate('categoryId', 'name slug'),
      this.eventModel.countDocuments(filter),
    ]);

    return { events, total };
  }

  async featureEvent(adminId: string, eventId: string, featured: boolean): Promise<EventDocument> {
    const event = await this.eventModel.findByIdAndUpdate(
      eventId,
      { $set: { isFeatured: featured } },
      { new: true },
    );
    if (!event) throw new NotFoundException('Event not found');
    await this.auditLogsService.log({
      userId: adminId,
      action: featured ? 'admin.event.featured' : 'admin.event.unfeatured',
      entityType: 'Event',
      entityId: eventId,
    });
    return event;
  }

  // ── Orders ─────────────────────────────────────────────────────
  async listOrders(page = 1, limit = 20, status?: string) {
    const filter: any = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name email')
        .populate('eventId', 'title slug'),
      this.orderModel.countDocuments(filter),
    ]);

    return { orders, total };
  }

  // ── Audit Logs ─────────────────────────────────────────────────
  async listAuditLogs(page = 1, limit = 50, userId?: string, action?: string) {
    return this.auditLogsService.findAll(page, limit, userId, action);
  }
}
