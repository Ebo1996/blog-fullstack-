import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Transaction reference to verify' })
  @IsString()
  tx_ref: string;
}
