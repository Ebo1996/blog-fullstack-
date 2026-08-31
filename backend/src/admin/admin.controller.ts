import {
  Controller, Get, Patch, Post, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class ChangeRoleDto {
  @ApiProperty({ enum: UserRole }) @IsEnum(UserRole) role: UserRole;
}

@ApiTags('admin')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Users ──────────────────────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: '[Admin] List all users' })
  async listUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    const result = await this.adminService.listUsers(+page, +limit, role, search);
    return { success: true, ...result };
  }

  @Post('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Suspend a user' })
  async suspendUser(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    const data = await this.adminService.suspendUser(adminId, id);
    return { success: true, data };
  }

  @Post('users/:id/unsuspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Unsuspend a user' })
  async unsuspendUser(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    const data = await this.adminService.unsuspendUser(adminId, id);
    return { success: true, data };
  }

  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Change user role' })
  async changeRole(
    @Param('id') id: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser('sub') adminId: string,
  ) {
    const data = await this.adminService.updateUserRole(adminId, id, dto.role);
    return { success: true, data };
  }

  // ── Events ─────────────────────────────────────────────────────
  @Get('events')
  @ApiOperation({ summary: '[Admin] List all events' })
  async listEvents(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    const result = await this.adminService.listEvents(+page, +limit, status);
    return { success: true, ...result };
  }

  @Post('events/:id/feature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Feature an event' })
  async featureEvent(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    const data = await this.adminService.featureEvent(adminId, id, true);
    return { success: true, data };
  }

  @Delete('events/:id/feature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Unfeature an event' })
  async unfeatureEvent(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    const data = await this.adminService.featureEvent(adminId, id, false);
    return { success: true, data };
  }

  // ── Orders ─────────────────────────────────────────────────────
  @Get('orders')
  @ApiOperation({ summary: '[Admin] List all orders' })
  async listOrders(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    const result = await this.adminService.listOrders(+page, +limit, status);
    return { success: true, ...result };
  }

  // ── Audit Logs ─────────────────────────────────────────────────
  @Get('audit-logs')
  @ApiOperation({ summary: '[Admin] List audit logs' })
  async listAuditLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    const result = await this.adminService.listAuditLogs(+page, +limit, userId, action);
    return { success: true, ...result };
  }
}
