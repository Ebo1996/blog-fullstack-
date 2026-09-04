import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
  HttpCode, HttpStatus, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ── Public endpoints ──────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published events with filtering' })
  async findAll(@Query() query: QueryEventsDto) {
    const result = await this.eventsService.findPublished(query);
    return { success: true, ...result };
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured events' })
  async getFeatured(@Query('limit') limit = 8) {
    const data = await this.eventsService.findFeatured(+limit);
    return { success: true, data };
  }

  @Public()
  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  async getUpcoming(@Query('limit') limit = 12) {
    const data = await this.eventsService.findUpcoming(+limit);
    return { success: true, data };
  }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Get trending events' })
  async getTrending(@Query('limit') limit = 8) {
    const data = await this.eventsService.findTrending(+limit);
    return { success: true, data };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get event detail by slug' })
  async findOne(@Param('slug') slug: string) {
    const data = await this.eventsService.findBySlug(slug);
    return { success: true, data };
  }

  @Public()
  @Get(':id/related')
  @ApiOperation({ summary: 'Get related events' })
  async getRelated(@Param('id') id: string, @Query('limit') limit = 4) {
    const event = await this.eventsService.findById(id);
    const data = await this.eventsService.findRelated(
      id,
      event.categoryId?.toString(),
      +limit,
    );
    return { success: true, data };
  }

  // ── Organizer endpoints ───────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Organizer] Create event' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateEventDto,
  ) {
    const data = await this.eventsService.create(userId, dto);
    return { success: true, data };
  }

  @Get('organizer/my-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Organizer] List own events' })
  async myEvents(
    @CurrentUser('sub') userId: string,
    @Query() query: QueryEventsDto,
  ) {
    const result = await this.eventsService.findByOrganizer(userId, query);
    return { success: true, ...result };
  }

  @Get('organizer/event/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Organizer] Get event by ID (including drafts)' })
  async getOrganizerEvent(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    console.log(`[getOrganizerEvent] User ${user.sub} requesting event ${id}`);
    try {
      const event = await this.eventsService.findById(id);
      
      // Extract organizer ID (could be populated or just ID)
      const organizerId = event.organizerId?._id 
        ? event.organizerId._id.toString() 
        : event.organizerId?.toString();
      
      console.log(`[getOrganizerEvent] Event found: ${event._id}, organizer ID: ${organizerId}`);
      
      // Verify ownership (unless admin)
      const isAdmin = user.role === UserRole.ADMIN;
      if (!isAdmin && organizerId !== user.sub) {
        console.log(`[getOrganizerEvent] Access denied: event organizer ${organizerId} != user ${user.sub}`);
        throw new NotFoundException('Event not found');
      }
      
      console.log(`[getOrganizerEvent] Access granted, returning event`);
      return { success: true, data: event };
    } catch (error) {
      console.error(`[getOrganizerEvent] Error:`, error.message);
      throw error;
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Organizer] Update event' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: Partial<CreateEventDto>,
  ) {
    const isAdmin = user.role === UserRole.ADMIN;
    const data = await this.eventsService.update(id, user.sub, dto, isAdmin);
    return { success: true, data };
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Organizer] Publish event' })
  async publish(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    const data = await this.eventsService.publish(id, user.sub, isAdmin);
    return { success: true, data };
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Organizer] Unpublish event' })
  async unpublish(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    const data = await this.eventsService.unpublish(id, user.sub, isAdmin);
    return { success: true, data };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Organizer] Cancel event' })
  async cancel(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    const data = await this.eventsService.cancel(id, user.sub, isAdmin);
    return { success: true, data };
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Organizer] Duplicate event as draft' })
  async duplicate(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const data = await this.eventsService.duplicate(id, userId);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Organizer] Delete draft event' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    await this.eventsService.deleteDraft(id, user.sub, isAdmin);
  }
}
