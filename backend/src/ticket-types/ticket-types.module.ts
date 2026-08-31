import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketTypesService } from './ticket-types.service';
import { TicketTypesController, TicketTypeDirectController } from './ticket-types.controller';
import { TicketType, TicketTypeSchema } from './schemas/ticket-type.schema';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TicketType.name, schema: TicketTypeSchema }]),
    EventsModule,
  ],
  controllers: [TicketTypesController, TicketTypeDirectController],
  providers: [TicketTypesService],
  exports: [TicketTypesService, MongooseModule],
})
export class TicketTypesModule {}
