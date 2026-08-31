import { IsString, IsNumberString, IsOptional, IsUrl, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitializePaymentDto {
  @ApiProperty({ description: 'Payment amount as string', example: '250.00' })
  @IsNumberString()
  amount: string;

  @ApiProperty({ description: 'Currency code', example: 'ETB' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Customer email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Customer first name' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'Customer last name' })
  @IsString()
  last_name: string;

  @ApiProperty({ description: 'Unique transaction reference' })
  @IsString()
  tx_ref: string;

  @ApiPropertyOptional({ description: 'Callback URL for Chapa to notify' })
  @IsOptional()
  @IsUrl()
  callback_url?: string;

  @ApiPropertyOptional({ description: 'URL to redirect user after payment' })
  @IsOptional()
  @IsUrl()
  return_url?: string;

  @ApiPropertyOptional({ description: 'Customer phone number' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({ description: 'Customization options' })
  @IsOptional()
  customization?: {
    title?: string;
    description?: string;
    logo?: string;
  };
}
