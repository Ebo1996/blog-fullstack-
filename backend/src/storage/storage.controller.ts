import {
  Controller, Post, UseGuards,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

@ApiTags('storage')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload/event-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload event cover image' })
  async uploadEventImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('sub') userId: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const { url, publicId } = await this.storageService.uploadBuffer(
      file.buffer,
      'events',
      `${userId}-${Date.now()}`,
    );
    return { success: true, data: { url, publicId } };
  }

  @Post('upload/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload user avatar' })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('sub') userId: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const { url, publicId } = await this.storageService.uploadBuffer(
      file.buffer,
      'avatars',
      `${userId}-avatar`,
    );
    return { success: true, data: { url, publicId } };
  }
}
