import { Module } from '@nestjs/common';
import { ChapaService } from './chapa.service';

/**
 * ChapaModule exposes ChapaService for use in other modules.
 * The controller lives in PaymentsModule to keep routing grouped under /payments.
 */
@Module({
  providers: [ChapaService],
  exports: [ChapaService],
})
export class ChapaModule {}
