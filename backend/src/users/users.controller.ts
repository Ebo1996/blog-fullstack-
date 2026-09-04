import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser('sub') userId: string) {
    const user = await this.usersService.findById(userId);
    return { success: true, data: user };
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    // If password change is requested
    if (dto.currentPassword && dto.newPassword) {
      // Validate current password
      const user = await this.usersService.findByIdWithSecrets(userId);
      const bcrypt = require('bcrypt');
      const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const passwordHash = await bcrypt.hash(dto.newPassword, 10);
      await this.usersService.updatePassword(userId, passwordHash);
      
      // Remove password fields from dto before updating other fields
      const { currentPassword, newPassword, ...profileDto } = dto;
      if (Object.keys(profileDto).length > 0) {
        const updatedUser = await this.usersService.update(userId, profileDto);
        return { success: true, data: updatedUser };
      }
      
      const updatedUser = await this.usersService.findById(userId);
      return { success: true, data: updatedUser };
    }
    
    // Regular profile update
    const user = await this.usersService.update(userId, dto);
    return { success: true, data: user };
  }
}
