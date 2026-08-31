import {
  Controller, Post, Get, Delete,
  Body, Param, Query, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrderStatus } from './schemas/order.schema';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class OrderQueryDto {
  @ApiPropertyOptional() page?: number;
  @ApiPropertyOptional() limit?: number;
  @ApiPropertyOptional({ enum: OrderStatus }) status?: OrderStatus;
}

@ApiTags('orders')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order and initialize Chapa payment' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    const data = await this.ordersService.createAndInitialize(userId, dto);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List my orders' })
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query() query: OrderQueryDto,
  ) {
    const result = await this.ordersService.findByUser(
      userId,
      query.page,
      query.limit,
      query.status,
    );
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const isAdmin = user.role === UserRole.ADMIN;
    const data = await this.ordersService.findById(id, user.sub, isAdmin);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending order' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const isAdmin = user.role === UserRole.ADMIN;
    const data = await this.ordersService.cancel(id, user.sub, isAdmin);
    return { success: true, data, message: 'Order cancelled' };
  }

  // Organizer: view orders for their event
  @Get('event/:eventId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: '[Organizer] List orders for an event' })
  async eventOrders(
    @Param('eventId') eventId: string,
    @CurrentUser() user: any,
    @Query() query: OrderQueryDto,
  ) {
    const isAdmin = user.role === UserRole.ADMIN;
    const result = await this.ordersService.findByEvent(
      eventId,
      user.sub,
      query.page,
      query.limit,
      isAdmin,
    );
    return { success: true, ...result };
  }
}
