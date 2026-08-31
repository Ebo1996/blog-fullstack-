import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active categories' })
  async findAll() {
    const data = await this.categoriesService.findAll();
    return { success: true, data };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get category by slug' })
  async findOne(@Param('slug') slug: string) {
    const data = await this.categoriesService.findBySlug(slug);
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Create category' })
  async create(@Body() dto: CreateCategoryDto) {
    const data = await this.categoriesService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Update category' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateCategoryDto>) {
    const data = await this.categoriesService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Delete category' })
  async remove(@Param('id') id: string) {
    await this.categoriesService.remove(id);
  }
}
