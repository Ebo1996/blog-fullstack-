import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CheckInsService } from './check-ins.service';
import { CheckInsController } from './check-ins.controller';
import { CheckIn, CheckInSchema } from './schemas/check-in.schema';
import { TicketsModule } from '../tickets/tickets.module';
import { EventsModule } from '../events/events.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CheckIn.name, schema: CheckInSchema }]),
    TicketsModule,
    EventsModule,
    AuditLogsModule,
  ],
  controllers: [CheckInsController],
  providers: [CheckInsService],
  exports: [CheckInsService, MongooseModule],
})
export class CheckInsModule {}
