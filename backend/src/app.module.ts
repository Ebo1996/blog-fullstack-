import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { CategoriesModule } from './categories/categories.module';
import { TicketTypesModule } from './ticket-types/ticket-types.module';
import { OrdersModule } from './orders/orders.module';
import { TicketsModule } from './tickets/tickets.module';
import { PaymentsModule } from './payments/payments.module';
import { CheckInsModule } from './check-ins/check-ins.module';
import { TransfersModule } from './transfers/transfers.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('MONGODB_DB_NAME', 'eventify'),
        // Disable autoIndex in production — run index creation separately
        autoIndex: configService.get<string>('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),

    // Rate limiting — applied globally via APP_GUARD below
    ThrottlerModule.forRoot([
      { name: 'short',  ttl: 1000,  limit: 10  },
      { name: 'medium', ttl: 10000, limit: 50  },
      { name: 'long',   ttl: 60000, limit: 200 },
    ]),

    // Scheduler (event reminders, expiry jobs, etc.)
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    UsersModule,
    EventsModule,
    CategoriesModule,
    TicketTypesModule,
    OrdersModule,
    TicketsModule,
    PaymentsModule,
    CheckInsModule,
    TransfersModule,
    RegistrationsModule,
    AnalyticsModule,
    NotificationsModule,
    AdminModule,
    AuditLogsModule,
    StorageModule,
  ],
  providers: [
    // Apply ThrottlerGuard to every endpoint globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
