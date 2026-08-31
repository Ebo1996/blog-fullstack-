import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CheckInsService } from './check-ins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class ScanDto {
  @ApiProperty() @IsString() qrToken: string;
  @ApiProperty() @IsMongoId() eventId: string;
}

@ApiTags('check-ins')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORGANIZER, UserRole.ADMIN)
@Controller('check-ins')
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Post('scan')
  @ApiOperation({ summary: '[Organizer] Scan QR token and check in attendee' })
  async scan(@Body() dto: ScanDto, @CurrentUser('sub') userId: string) {
    const data = await this.checkInsService.scan(dto.qrToken, dto.eventId, userId);
    return { success: true, data };
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: '[Organizer] List check-ins for an event' })
  async findByEvent(
    @Param('eventId') eventId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const result = await this.checkInsService.findByEvent(eventId, +page, +limit);
    return { success: true, ...result };
  }
}
