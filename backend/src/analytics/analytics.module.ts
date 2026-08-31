import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { OrdersModule } from '../orders/orders.module';
import { EventsModule } from '../events/events.module';
import { TicketsModule } from '../tickets/tickets.module';
import { CheckInsModule } from '../check-ins/check-ins.module';
import { UsersModule } from '../users/users.module';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { Ticket, TicketSchema } from '../tickets/schemas/ticket.schema';
import { CheckIn, CheckInSchema } from '../check-ins/schemas/check-in.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Event.name, schema: EventSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: CheckIn.name, schema: CheckInSchema },
      { name: User.name, schema: UserSchema },
    ]),
    EventsModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
