import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';
import { OrdersModule } from '../orders/orders.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Event.name, schema: EventSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    UsersModule,
    EventsModule,
    OrdersModule,
    AuditLogsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
