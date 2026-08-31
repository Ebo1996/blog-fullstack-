import {
  IsString, IsOptional, MaxLength, IsDateString,
  IsEnum, IsBoolean, IsArray, IsNumber, Min,
  ValidateNested, IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../schemas/event.schema';

class VenueDto {
  @ApiProperty() @IsString() @MaxLength(200) name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiProperty() @IsString() city: string;
  @ApiProperty() @IsString() country: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lat?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lng?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() onlineUrl?: string;
}

export class CreateEventDto {
  @ApiProperty({ example: 'Addis Tech Summit 2027' })
  @IsString() @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'A premier technology conference in Addis Ababa.' })
  @IsString() @MaxLength(10000)
  description: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional() @IsString() @MaxLength(300)
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  imageUrl?: string;

  @ApiProperty({ type: VenueDto })
  @ValidateNested() @Type(() => VenueDto)
  venue: VenueDto;

  @ApiProperty({ example: '2027-06-15T09:00:00Z' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ example: '2027-06-15T18:00:00Z' })
  @IsDateString()
  endAt: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional() @IsNumber() @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ enum: EventType, default: EventType.IN_PERSON })
  @IsOptional() @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  isRsvpOnly?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ default: 'ETB' })
  @IsOptional() @IsString()
  currency?: string;
}
