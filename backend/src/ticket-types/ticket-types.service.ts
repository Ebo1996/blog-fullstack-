import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TicketType, TicketTypeDocument, TicketTypeStatus } from './schemas/ticket-type.schema';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { EventsService } from '../events/events.service';
import { UserRole } from '../common/decorators/roles.decorator';

@Injectable()
export class TicketTypesService {
  constructor(
    @InjectModel(TicketType.name) private ticketTypeModel: Model<TicketTypeDocument>,
    private readonly eventsService: EventsService,
  ) {}

  async findByEvent(eventId: string): Promise<TicketTypeDocument[]> {
    return this.ticketTypeModel
      .find({ eventId: new Types.ObjectId(eventId) })
      .sort({ price: 1 });
  }

  async findById(id: string): Promise<TicketTypeDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Ticket type not found');
    const tt = await this.ticketTypeModel.findById(id);
    if (!tt) throw new NotFoundException('Ticket type not found');
    return tt;
  }

  async create(
    eventId: string,
    dto: CreateTicketTypeDto,
    userId: string,
    userRole: UserRole,
  ): Promise<TicketTypeDocument> {
    const event = await this.eventsService.findById(eventId);
    const ownerId = (event.organizerId as any)?._id || event.organizerId;
    if (ownerId.toString() !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not own this event');
    }

    const ticketType = await this.ticketTypeModel.create({
      ...dto,
      eventId: new Types.ObjectId(eventId),
    });

    await this.syncEventPriceRange(eventId);
    return ticketType;
  }

  async update(
    id: string,
    dto: Partial<CreateTicketTypeDto>,
    userId: string,
    userRole: UserRole,
  ): Promise<TicketTypeDocument> {
    const tt = await this.findById(id);
    const event = await this.eventsService.findById(tt.eventId.toString());

    const ownerId = (event.organizerId as any)?._id || event.organizerId;
    if (ownerId.toString() !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not own this event');
    }

    // Guard: cannot reduce quantity below soldQuantity
    if (dto.quantity !== undefined && dto.quantity < tt.soldQuantity) {
      throw new BadRequestException(
        `Cannot reduce quantity below sold quantity (${tt.soldQuantity} already sold)`,
      );
    }

    Object.assign(tt, dto);
    const saved = await tt.save();
    await this.syncEventPriceRange(tt.eventId.toString());
    return saved;
  }

  async pauseSales(id: string, userId: string, userRole: UserRole): Promise<TicketTypeDocument> {
    const tt = await this.findById(id);
    const event = await this.eventsService.findById(tt.eventId.toString());
    const ownerId = (event.organizerId as any)?._id || event.organizerId;
    if (ownerId.toString() !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not own this event');
    }
    tt.status = TicketTypeStatus.PAUSED;
    return tt.save();
  }

  async delete(id: string, userId: string, userRole: UserRole): Promise<void> {
    const tt = await this.findById(id);
    const event = await this.eventsService.findById(tt.eventId.toString());

    const ownerId = (event.organizerId as any)?._id || event.organizerId;
    if (ownerId.toString() !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not own this event');
    }

    if (tt.soldQuantity > 0) {
      throw new BadRequestException(
        'Cannot delete a ticket type that has already sold tickets. Pause it instead.',
      );
    }

    await this.ticketTypeModel.findByIdAndDelete(id);
    await this.syncEventPriceRange(tt.eventId.toString());
  }

  async resumeSales(id: string, userId: string, userRole: UserRole): Promise<TicketTypeDocument> {
    const tt = await this.findById(id);
    const event = await this.eventsService.findById(tt.eventId.toString());
    const ownerId = (event.organizerId as any)?._id || event.organizerId;
    if (ownerId.toString() !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not own this event');
    }
    if (tt.soldQuantity >= tt.quantity) {
      throw new ConflictException('Ticket type is sold out; increase quantity first');
    }
    tt.status = TicketTypeStatus.ACTIVE;
    return tt.save();
  }

  // Called during payment processing — uses atomic MongoDB update to prevent overselling
  async reserveInventory(
    ticketTypeId: string,
    quantity: number,
    session: any,
  ): Promise<TicketTypeDocument> {
    const updated = await this.ticketTypeModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(ticketTypeId),
        status: TicketTypeStatus.ACTIVE,
        $expr: {
          $lte: [{ $add: ['$soldQuantity', quantity] }, '$quantity'],
        },
      },
      {
        $inc: { soldQuantity: quantity },
      },
      { new: true, session },
    );

    if (!updated) {
      throw new ConflictException(
        'Tickets are no longer available in the requested quantity',
      );
    }

    // Auto-mark as sold out if needed
    if (updated.soldQuantity >= updated.quantity) {
      updated.status = TicketTypeStatus.SOLD_OUT;
      await updated.save({ session });
    }

    return updated;
  }

  // Undo inventory reservation (e.g., failed payment)
  async releaseInventory(
    ticketTypeId: string,
    quantity: number,
    session?: any,
  ): Promise<void> {
    await this.ticketTypeModel.findByIdAndUpdate(
      ticketTypeId,
      {
        $inc: { soldQuantity: -quantity },
        $set: { status: TicketTypeStatus.ACTIVE },
      },
      { session },
    );
  }

  private async syncEventPriceRange(eventId: string): Promise<void> {
    const types = await this.ticketTypeModel.find({
      eventId: new Types.ObjectId(eventId),
      status: { $ne: TicketTypeStatus.EXPIRED },
    });

    if (!types.length) return;

    const prices = types.map((t) => t.price);
    await this.eventsService.updatePriceRange(
      eventId,
      Math.min(...prices),
      Math.max(...prices),
    );
  }
}
