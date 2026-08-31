import {
  Controller, Get, Post, Patch, Delete, Param,
  Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketTypesService } from './ticket-types.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('ticket-types')
@Controller('events/:eventId/ticket-types')
export class TicketTypesController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List ticket types for an event' })
  async findAll(@Param('eventId') eventId: string) {
    const data = await this.ticketTypesService.findByEvent(eventId);
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Organizer] Create ticket type' })
  async create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateTicketTypeDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.ticketTypesService.create(eventId, dto, user.sub, user.role);
    return { success: true, data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Organizer] Update ticket type' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTicketTypeDto>,
    @CurrentUser() user: any,
  ) {
    const data = await this.ticketTypesService.update(id, dto, user.sub, user.role);
    return { success: true, data };
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Organizer] Pause ticket sales' })
  async pause(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.ticketTypesService.pauseSales(id, user.sub, user.role);
    return { success: true, data };
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Organizer] Resume ticket sales' })
  async resume(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.ticketTypesService.resumeSales(id, user.sub, user.role);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Organizer] Delete ticket type (only if no tickets sold)' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.ticketTypesService.delete(id, user.sub, user.role);
  }
}

// Standalone controller for direct ticket-type access
@ApiTags('ticket-types')
@Controller('ticket-types')
export class TicketTypeDirectController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get ticket type by id' })
  async findOne(@Param('id') id: string) {
    const data = await this.ticketTypesService.findById(id);
    return { success: true, data };
  }
}
