import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order, OrderSchema } from './schemas/order.schema';
import { TicketTypesModule } from '../ticket-types/ticket-types.module';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { ChapaService } from '../payments/chapa/chapa.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    TicketTypesModule,
    EventsModule,
    UsersModule,
    AuditLogsModule,
    PaymentsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, ChapaService],
  exports: [OrdersService, MongooseModule],
})
export class OrdersModule {}
