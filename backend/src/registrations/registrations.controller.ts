import { Controller, Post, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('registrations')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post(':eventId/rsvp')
  @ApiOperation({ summary: 'RSVP to an event' })
  async rsvp(@Param('eventId') eventId: string, @CurrentUser('sub') userId: string) {
    const data = await this.registrationsService.rsvp(userId, eventId);
    return { success: true, data };
  }

  @Delete(':eventId/rsvp')
  @ApiOperation({ summary: 'Cancel RSVP' })
  async cancel(@Param('eventId') eventId: string, @CurrentUser('sub') userId: string) {
    await this.registrationsService.cancel(userId, eventId);
    return { success: true, data: null, message: 'RSVP cancelled' };
  }

  @Get('my')
  @ApiOperation({ summary: 'List my RSVPs' })
  async myRsvps(@CurrentUser('sub') userId: string) {
    const data = await this.registrationsService.findByUser(userId);
    return { success: true, data };
  }
}
