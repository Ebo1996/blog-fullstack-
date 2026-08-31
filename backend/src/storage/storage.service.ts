import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload a buffer to Cloudinary.
   * Returns the secure URL and public_id.
   * File data is never stored in MongoDB — only the URL.
   */
  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    fileName: string,
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `eventify/${folder}`,
          public_id: fileName,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 630, crop: 'fill', quality: 'auto' },
          ],
        },
        (error, result: UploadApiResponse) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`);
            reject(new BadRequestException('Image upload failed'));
          } else {
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        },
      );
      uploadStream.end(buffer);
    });
  }

  async deleteByPublicId(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err: any) {
      this.logger.warn(`Failed to delete image ${publicId}: ${err.message}`);
    }
  }
}
