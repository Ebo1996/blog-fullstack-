import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { Transfer, TransferSchema } from './schemas/transfer.schema';
import { TicketsModule } from '../tickets/tickets.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transfer.name, schema: TransferSchema }]),
    TicketsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [TransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
