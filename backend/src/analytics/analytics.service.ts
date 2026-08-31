import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Event, EventDocument } from '../events/schemas/event.schema';
import { Ticket, TicketDocument } from '../tickets/schemas/ticket.schema';
import { CheckIn, CheckInDocument } from '../check-ins/schemas/check-in.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { EventsService } from '../events/events.service';
import { UserRole } from '../common/decorators/roles.decorator';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(CheckIn.name) private readonly checkInModel: Model<CheckInDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly eventsService: EventsService,
  ) {}

  // ── Organizer analytics for a single event ─────────────────────
  async getEventAnalytics(eventId: string, requesterId: string, requesterRole: UserRole) {
    const event = await this.eventsService.findById(eventId);

    if (requesterRole !== UserRole.ADMIN && event.organizerId.toString() !== requesterId) {
      throw new ForbiddenException('Access denied');
    }

    const oid = new Types.ObjectId(eventId);

    const [revenueAgg, ticketsByType, salesOverTime, checkInStats, orderStats] =
      await Promise.all([
        // Total revenue from paid orders
        this.orderModel.aggregate([
          { $match: { eventId: oid, status: 'paid' } },
          {
            $group: {
              _id: null,
              grossRevenue: { $sum: '$totalAmount' },
              totalOrders: { $sum: 1 },
              totalFees: { $sum: '$fees' },
            },
          },
        ]),

        // Tickets sold by type
        this.ticketModel.aggregate([
          { $match: { eventId: oid } },
          {
            $group: {
              _id: '$ticketTypeName',
              count: { $sum: 1 },
              statuses: { $push: '$status' },
            },
          },
          { $sort: { count: -1 } },
        ]),

        // Sales over time (daily)
        this.orderModel.aggregate([
          { $match: { eventId: oid, status: 'paid' } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              revenue: { $sum: '$totalAmount' },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // Check-in count
        this.checkInModel.countDocuments({ eventId: oid }),

        // Order status breakdown
        this.orderModel.aggregate([
          { $match: { eventId: oid } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
      ]);

    const revenue = revenueAgg[0] ?? { grossRevenue: 0, totalOrders: 0, totalFees: 0 };
    const totalTickets = await this.ticketModel.countDocuments({ eventId: oid });
    const activeTickets = await this.ticketModel.countDocuments({ eventId: oid, status: 'active' });

    return {
      eventId,
      revenue: {
        gross: revenue.grossRevenue,
        fees: revenue.totalFees,
        net: revenue.grossRevenue - revenue.totalFees,
      },
      orders: {
        total: revenue.totalOrders,
        byStatus: orderStats.reduce((acc: any, s: any) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
      },
      tickets: {
        total: totalTickets,
        active: activeTickets,
        used: totalTickets - activeTickets,
        byType: ticketsByType,
      },
      checkIns: checkInStats,
      salesOverTime,
      capacity: event.capacity ?? null,
      capacityUsed: totalTickets,
    };
  }

  // ── Organizer dashboard overview ───────────────────────────────
  async getOrganizerOverview(organizerId: string) {
    const oid = new Types.ObjectId(organizerId);

    const [events, orderStats, upcomingEvents] = await Promise.all([
      this.eventModel.aggregate([
        { $match: { organizerId: oid } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      this.orderModel.aggregate([
        {
          $lookup: {
            from: 'events',
            localField: 'eventId',
            foreignField: '_id',
            as: 'event',
          },
        },
        { $unwind: '$event' },
        { $match: { 'event.organizerId': oid, status: 'paid' } },
        {
          $group: {
            _id: null,
            grossRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
          },
        },
      ]),

      this.eventModel
        .find({
          organizerId: oid,
          status: 'published',
          startAt: { $gte: new Date() },
        })
        .sort({ startAt: 1 })
        .limit(5)
        .select('title slug startAt venue status'),
    ]);

    const totalTicketsSold = await this.ticketModel.countDocuments({
      eventId: {
        $in: await this.eventModel.find({ organizerId: oid }).distinct('_id'),
      },
    });

    const stats = orderStats[0] ?? { grossRevenue: 0, totalOrders: 0 };
    const eventsByStatus = events.reduce((acc: any, e: any) => {
      acc[e._id] = e.count;
      return acc;
    }, {});

    return {
      events: {
        total: Object.values(eventsByStatus).reduce((a: any, b: any) => a + b, 0),
        byStatus: eventsByStatus,
      },
      revenue: { gross: stats.grossRevenue },
      ticketsSold: totalTicketsSold,
      upcomingEvents,
    };
  }

  // ── Public homepage stats (no auth required) ───────────────────
  async getPublicStats() {
    const [totalEvents, totalUsers, totalTickets, totalOrganizers, totalCheckIns, monthlySales] =
      await Promise.all([
        this.eventModel.countDocuments({ status: 'published' }),
        this.userModel.countDocuments({ role: 'attendee' }),
        this.ticketModel.countDocuments(),
        this.userModel.countDocuments({ role: 'organizer' }),
        this.checkInModel.countDocuments(),
        // Last 7 months of ticket sales for sparkline
        this.ticketModel.aggregate([
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
          { $limit: 7 },
        ]),
      ]);

    // Normalise sparkline to 0–100 range based on max month
    const maxVal = Math.max(...monthlySales.map((m: any) => m.count), 1);
    const sparkline: number[] = monthlySales.map((m: any) =>
      Math.round((m.count / maxVal) * 100),
    );
    // Pad to at least 7 points if fewer months exist
    while (sparkline.length < 7) sparkline.unshift(0);

    return {
      totalEvents,
      totalAttendees: totalUsers,
      totalTickets,
      totalOrganizers,
      totalCheckIns,
      sparkline,
    };
  }

  // ── Admin platform overview ─────────────────────────────────────
  async getPlatformOverview() {
    const [
      totalUsers, totalOrganizers, totalEvents, publishedEvents,
      orderStats, ticketStats, checkInStats,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: 'attendee' }),
      this.userModel.countDocuments({ role: 'organizer' }),
      this.eventModel.countDocuments(),
      this.eventModel.countDocuments({ status: 'published' }),
      this.orderModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      ]),
      this.ticketModel.countDocuments(),
      this.checkInModel.countDocuments(),
    ]);

    const ordersByStatus = orderStats.reduce((acc: any, s: any) => {
      acc[s._id] = { count: s.count, revenue: s.revenue };
      return acc;
    }, {});

    const grossRevenue = (ordersByStatus['paid']?.revenue) ?? 0;

    return {
      users: { attendees: totalUsers, organizers: totalOrganizers, total: totalUsers + totalOrganizers },
      events: { total: totalEvents, published: publishedEvents },
      orders: ordersByStatus,
      tickets: { total: ticketStats },
      checkIns: checkInStats,
      revenue: { gross: grossRevenue },
    };
  }
}
