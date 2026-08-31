import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/decorators/roles.decorator';

export class RegisterDto {
  @ApiProperty({ example: 'Abebe Bekele' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'abebe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ssw0rd', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.ATTENDEE })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
