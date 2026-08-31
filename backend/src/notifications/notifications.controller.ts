import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications' })
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.notificationsService.findByUser(userId, +page, +limit);
    return { success: true, ...result };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.notificationsService.markRead(id, userId);
    return { success: true, data: null };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser('sub') userId: string) {
    await this.notificationsService.markAllRead(userId);
    return { success: true, data: null };
  }
}
