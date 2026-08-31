import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument, EventStatus } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { generateSlug } from '../common/utils/slug.util';
import { getPaginationMeta } from '../common/dto/pagination.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // ─── Public: list published events with server-side filtering ──
  async findPublished(query: QueryEventsDto) {
    const {
      page = 1, limit = 20, search, category,
      city, dateFrom, dateTo, priceMin, priceMax,
      sort = 'soonest', featured,
    } = query;

    const filter: any = { status: EventStatus.PUBLISHED };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'venue.city': { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (category) {
      if (Types.ObjectId.isValid(category)) {
        filter.categoryId = new Types.ObjectId(category);
      }
    }

    if (city) {
      filter['venue.city'] = { $regex: city, $options: 'i' };
    }

    if (dateFrom || dateTo) {
      filter.startAt = {};
      if (dateFrom) filter.startAt.$gte = new Date(dateFrom);
      if (dateTo) filter.startAt.$lte = new Date(dateTo);
    } else {
      filter.startAt = { $gte: new Date() };
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      filter.minPrice = {};
      if (priceMin !== undefined) filter.minPrice.$gte = priceMin;
      if (priceMax !== undefined) filter.maxPrice = { $lte: priceMax };
    }

    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    const sortMap: Record<string, any> = {
      recommended: { isFeatured: -1, startAt: 1 },
      soonest: { startAt: 1 },
      newest: { createdAt: -1 },
      price_asc: { minPrice: 1 },
      price_desc: { maxPrice: -1 },
    };

    const sortOpt = sortMap[sort] ?? { startAt: 1 };
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.eventModel
        .find(filter)
        .sort(sortOpt)
        .skip(skip)
        .limit(limit)
        .populate('categoryId', 'name slug color icon')
        .populate('organizerId', 'name image'),
      this.eventModel.countDocuments(filter),
    ]);

    return { events, meta: getPaginationMeta(total, page, limit) };
  }

  // ─── Public: get by slug ────────────────────────────────────────
  async findBySlug(slug: string): Promise<EventDocument> {
    const event = await this.eventModel
      .findOne({ slug, status: EventStatus.PUBLISHED })
      .populate('categoryId', 'name slug color icon')
      .populate('organizerId', 'name image bio');

    if (!event) throw new NotFoundException('Event not found');

    this.eventModel.findByIdAndUpdate(event._id, { $inc: { viewCount: 1 } }).exec();

    return event;
  }

  // ─── Get event by id (also used internally) ────────────────────
  async findById(id: string): Promise<EventDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Event not found');
    const event = await this.eventModel
      .findById(id)
      .populate('categoryId', 'name slug color icon')
      .populate('organizerId', 'name image');
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  // ─── Related events ────────────────────────────────────────────
  async findRelated(eventId: string, categoryId: string, limit = 4) {
    return this.eventModel
      .find({
        _id: { $ne: new Types.ObjectId(eventId) },
        categoryId: new Types.ObjectId(categoryId),
        status: EventStatus.PUBLISHED,
        startAt: { $gte: new Date() },
      })
      .sort({ startAt: 1 })
      .limit(limit)
      .populate('categoryId', 'name slug color');
  }

  // ─── Organizer: list own events ────────────────────────────────
  async findByOrganizer(organizerId: string, query: QueryEventsDto) {
    const { page = 1, limit = 20, status, search } = query;
    const filter: any = { organizerId: new Types.ObjectId(organizerId) };
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      this.eventModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('categoryId', 'name slug'),
      this.eventModel.countDocuments(filter),
    ]);

    return { events, meta: getPaginationMeta(total, page, limit) };
  }

  // ─── Create ────────────────────────────────────────────────────
  async create(organizerId: string, dto: CreateEventDto): Promise<EventDocument> {
    if (new Date(dto.startAt) >= new Date(dto.endAt)) {
      throw new BadRequestException('End date must be after start date');
    }

    const slug = generateSlug(dto.title);

    const event = await this.eventModel.create({
      ...dto,
      organizerId: new Types.ObjectId(organizerId),
      categoryId: dto.categoryId ? new Types.ObjectId(dto.categoryId) : undefined,
      slug,
      status: EventStatus.DRAFT,
    });

    // Audit log
    this.auditLogsService.log({
      userId: organizerId,
      action: 'event.created',
      entityType: 'Event',
      entityId: event._id.toString(),
      metadata: { title: event.title },
    }).catch(() => {});

    return event;
  }

  // ─── Update ────────────────────────────────────────────────────
  async update(
    id: string,
    organizerId: string,
    dto: Partial<CreateEventDto>,
    isAdmin = false,
  ): Promise<EventDocument> {
    const event = await this.findById(id);
    this.assertOwnership(event, organizerId, isAdmin);

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Cannot edit a cancelled event');
    }

    if (dto.startAt && dto.endAt) {
      if (new Date(dto.startAt) >= new Date(dto.endAt)) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Audit if price-related fields changed
    if (dto.hasOwnProperty('minPrice') || dto.hasOwnProperty('maxPrice')) {
      this.auditLogsService.log({
        userId: organizerId,
        action: 'event.price_changed',
        entityType: 'Event',
        entityId: id,
        metadata: { updated: Object.keys(dto) },
      }).catch(() => {});
    }

    Object.assign(event, {
      ...dto,
      categoryId: dto.categoryId ? new Types.ObjectId(dto.categoryId) : event.categoryId,
    });

    return event.save();
  }

  // ─── Publish ───────────────────────────────────────────────────
  async publish(id: string, organizerId: string, isAdmin = false): Promise<EventDocument> {
    const event = await this.findById(id);
    this.assertOwnership(event, organizerId, isAdmin);

    if (event.status === EventStatus.PUBLISHED) {
      throw new ConflictException('Event is already published');
    }
    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Cannot publish a cancelled event');
    }
    if (!event.imageUrl) {
      throw new BadRequestException('Event must have an image before publishing');
    }

    event.status = EventStatus.PUBLISHED;
    await event.save();

    this.auditLogsService.log({
      userId: organizerId,
      action: 'event.published',
      entityType: 'Event',
      entityId: id,
      metadata: { title: event.title },
    }).catch(() => {});

    return event;
  }

  // ─── Unpublish ─────────────────────────────────────────────────
  async unpublish(id: string, organizerId: string, isAdmin = false): Promise<EventDocument> {
    const event = await this.findById(id);
    this.assertOwnership(event, organizerId, isAdmin);

    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('Event is not currently published');
    }

    event.status = EventStatus.DRAFT;
    return event.save();
  }

  // ─── Cancel ────────────────────────────────────────────────────
  async cancel(id: string, organizerId: string, isAdmin = false): Promise<EventDocument> {
    const event = await this.findById(id);
    this.assertOwnership(event, organizerId, isAdmin);

    if (event.status === EventStatus.CANCELLED) {
      throw new ConflictException('Event is already cancelled');
    }
    if (event.status === EventStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed event');
    }

    event.status = EventStatus.CANCELLED;
    await event.save();

    this.auditLogsService.log({
      userId: organizerId,
      action: 'event.cancelled',
      entityType: 'Event',
      entityId: id,
      metadata: { title: event.title },
    }).catch(() => {});

    return event;
  }

  // ─── Duplicate ─────────────────────────────────────────────────
  async duplicate(id: string, organizerId: string): Promise<EventDocument> {
    const event = await this.findById(id);
    this.assertOwnership(event, organizerId, false);

    const { _id, slug, status, viewCount, createdAt, updatedAt, ...rest } = event.toObject();
    const newSlug = generateSlug(`${event.title} copy`);

    return this.eventModel.create({
      ...rest,
      slug: newSlug,
      title: `${event.title} (Copy)`,
      status: EventStatus.DRAFT,
      viewCount: 0,
    });
  }

  // ─── Delete draft ──────────────────────────────────────────────
  async deleteDraft(id: string, organizerId: string, isAdmin = false): Promise<void> {
    const event = await this.findById(id);
    this.assertOwnership(event, organizerId, isAdmin);

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Only draft events can be deleted');
    }

    await this.eventModel.findByIdAndDelete(id);
  }

  // ─── Update price range (called after ticket type changes) ─────
  async updatePriceRange(
    eventId: string,
    minPrice: number,
    maxPrice: number,
  ): Promise<void> {
    await this.eventModel.findByIdAndUpdate(eventId, {
      $set: { minPrice, maxPrice },
    });
  }

  // ─── Featured events ───────────────────────────────────────────
  async findFeatured(limit = 8): Promise<EventDocument[]> {
    return this.eventModel
      .find({ status: EventStatus.PUBLISHED, isFeatured: true, startAt: { $gte: new Date() } })
      .sort({ startAt: 1 })
      .limit(limit)
      .populate('categoryId', 'name slug color icon');
  }

  // ─── Upcoming events (public homepage) ─────────────────────────
  async findUpcoming(limit = 12): Promise<EventDocument[]> {
    return this.eventModel
      .find({ status: EventStatus.PUBLISHED, startAt: { $gte: new Date() } })
      .sort({ startAt: 1 })
      .limit(limit)
      .populate('categoryId', 'name slug color icon');
  }

  // ─── Trending events ───────────────────────────────────────────
  async findTrending(limit = 8): Promise<EventDocument[]> {
    return this.eventModel
      .find({ status: EventStatus.PUBLISHED, startAt: { $gte: new Date() } })
      .sort({ viewCount: -1, startAt: 1 })
      .limit(limit)
      .populate('categoryId', 'name slug color icon');
  }

  // ─── Mark completed (admin/scheduler) ─────────────────────────
  async markCompleted(id: string): Promise<void> {
    await this.eventModel.findByIdAndUpdate(id, {
      $set: { status: EventStatus.COMPLETED },
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────
  private assertOwnership(
    event: EventDocument,
    userId: string,
    isAdmin: boolean,
  ): void {
    if (isAdmin) return;
    if (event.organizerId.toString() !== userId) {
      throw new ForbiddenException('You do not own this event');
    }
  }
}
