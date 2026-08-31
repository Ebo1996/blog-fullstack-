import { Controller, Post, Get, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransfersService, InitiateTransferDto } from './transfers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('transfers')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @ApiOperation({ summary: 'Initiate a ticket transfer' })
  async initiate(@CurrentUser('sub') userId: string, @Body() dto: InitiateTransferDto) {
    const data = await this.transfersService.initiate(userId, dto);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List my transfers (sent and received)' })
  async findAll(@CurrentUser('sub') userId: string) {
    const data = await this.transfersService.findByUser(userId);
    return { success: true, data };
  }

  @Get('pending')
  @ApiOperation({ summary: 'List pending transfers waiting for my acceptance' })
  async findPending(@CurrentUser('sub') userId: string) {
    const data = await this.transfersService.findPendingForUser(userId);
    return { success: true, data };
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a transfer' })
  async accept(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const data = await this.transfersService.accept(id, userId);
    return { success: true, data };
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a transfer' })
  async reject(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const data = await this.transfersService.reject(id, userId);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a transfer (sender only)' })
  async cancel(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const data = await this.transfersService.cancel(id, userId);
    return { success: true, data };
  }
}
