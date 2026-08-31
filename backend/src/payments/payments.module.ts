import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsService } from './payments.service';
import { ChapaService } from './chapa/chapa.service';
import { ChapaController } from './chapa/chapa.controller';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { TicketsModule } from '../tickets/tickets.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    TicketsModule,
    AuditLogsModule,
    NotificationsModule,
  ],
  controllers: [ChapaController],
  providers: [PaymentsService, ChapaService],
  exports: [PaymentsService, ChapaService],
})
export class PaymentsModule {}
