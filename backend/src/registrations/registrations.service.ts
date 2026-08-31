import {
  Injectable, ConflictException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Registration, RegistrationDocument } from './schemas/registration.schema';
import { EventsService } from '../events/events.service';
import { EventStatus } from '../events/schemas/event.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectModel(Registration.name) private readonly registrationModel: Model<RegistrationDocument>,
    private readonly eventsService: EventsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async rsvp(userId: string, eventId: string): Promise<RegistrationDocument> {
    const event = await this.eventsService.findById(eventId);

    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('This event is not accepting RSVPs');
    }

    if (!event.isRsvpOnly) {
      throw new BadRequestException('This event uses paid tickets, not RSVP');
    }

    try {
      const registration = await this.registrationModel.create({
        eventId: new Types.ObjectId(eventId),
        userId: new Types.ObjectId(userId),
      });

      // Notify attendee of RSVP confirmation (best effort)
      this.notificationsService.create({
        userId,
        type: NotificationType.RSVP_CONFIRMATION,
        title: 'RSVP confirmed',
        body: `You're registered for "${event.title}".`,
        data: { eventId, eventTitle: event.title },
      }).catch(() => {});

      return registration;
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ConflictException('You are already registered for this event');
      }
      throw err;
    }
  }

  async cancel(userId: string, eventId: string): Promise<void> {
    const result = await this.registrationModel.findOneAndDelete({
      eventId: new Types.ObjectId(eventId),
      userId: new Types.ObjectId(userId),
    });
    if (!result) throw new NotFoundException('RSVP not found');
  }

  async findByUser(userId: string) {
    return this.registrationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('eventId', 'title slug imageUrl startAt venue status');
  }

  async findByEvent(eventId: string, page = 1, limit = 20) {
    const filter = { eventId: new Types.ObjectId(eventId) };
    const [registrations, total] = await Promise.all([
      this.registrationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name email'),
      this.registrationModel.countDocuments(filter),
    ]);
    return { registrations, total };
  }

  async isRegistered(userId: string, eventId: string): Promise<boolean> {
    const reg = await this.registrationModel.findOne({
      userId: new Types.ObjectId(userId),
      eventId: new Types.ObjectId(eventId),
    });
    return !!reg;
  }
}
