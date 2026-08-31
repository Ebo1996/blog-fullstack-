import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { EventStatus } from '../schemas/event.schema';

export class QueryEventsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  priceMin?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber()
  priceMax?: number;

  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional() @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ enum: ['recommended', 'soonest', 'newest', 'price_asc', 'price_desc'] })
  @IsOptional() @IsString()
  sort?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean() @Type(() => Boolean)
  featured?: boolean;
}
