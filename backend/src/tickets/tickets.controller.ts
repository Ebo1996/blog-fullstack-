import {
  Controller, Get, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TicketStatus } from './schemas/ticket.schema';

class TicketQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}

@ApiTags('tickets')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'List my tickets' })
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query() query: TicketQueryDto,
  ) {
    const result = await this.ticketsService.findByOwner(
      userId,
      query.page,
      query.limit,
      query.status,
    );
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    const data = await this.ticketsService.findById(id, userId);
    return { success: true, data };
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Get QR code data URL for ticket' })
  async getQr(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    const qrDataUrl = await this.ticketsService.getQrDataUrl(id, userId);
    return { success: true, data: { qrDataUrl } };
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get all tickets for an order' })
  async findByOrder(@Param('orderId') orderId: string) {
    const data = await this.ticketsService.findByOrder(orderId);
    return { success: true, data };
  }
}
