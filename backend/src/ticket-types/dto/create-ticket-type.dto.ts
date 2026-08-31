import {
  IsString, IsOptional, MaxLength, IsNumber,
  Min, Max, IsDateString, IsBoolean, IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketTypeDto {
  @ApiProperty({ example: 'VIP' })
  @IsString() @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 500, minimum: 0 })
  @IsNumber() @Min(0)
  price: number;

  @ApiPropertyOptional({ default: 'ETB' })
  @IsOptional() @IsString()
  currency?: string;

  @ApiProperty({ example: 100, minimum: 1 })
  @IsNumber() @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  salesStartAt?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  salesEndAt?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional() @IsNumber() @Min(1)
  minPerOrder?: number;

  @ApiPropertyOptional({ default: 10, minimum: 1 })
  @IsOptional() @IsNumber() @Min(1) @Max(100)
  maxPerOrder?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  isTransferable?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  isRefundable?: boolean;
}
