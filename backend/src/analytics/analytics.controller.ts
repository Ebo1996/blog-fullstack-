import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ── Public ───────────────────────────────────────────────────────
  @Public()
  @Get('public/stats')
  @ApiOperation({ summary: 'Get public platform stats for homepage' })
  async publicStats() {
    const data = await this.analyticsService.getPublicStats();
    return { success: true, data };
  }

  // ── Organizer (requires JWT) ──────────────────────────────────────
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @Get('organizer/overview')
  @ApiOperation({ summary: '[Organizer] Get dashboard overview' })
  async organizerOverview(@CurrentUser('sub') userId: string) {
    const data = await this.analyticsService.getOrganizerOverview(userId);
    return { success: true, data };
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @Get('organizer/events/:eventId')
  @ApiOperation({ summary: '[Organizer] Get analytics for a specific event' })
  async eventAnalytics(@Param('eventId') eventId: string, @CurrentUser() user: any) {
    const data = await this.analyticsService.getEventAnalytics(eventId, user.sub, user.role);
    return { success: true, data };
  }

  // ── Admin ─────────────────────────────────────────────────────────
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/platform')
  @ApiOperation({ summary: '[Admin] Get platform-wide analytics' })
  async platformOverview() {
    const data = await this.analyticsService.getPlatformOverview();
    return { success: true, data };
  }
}
