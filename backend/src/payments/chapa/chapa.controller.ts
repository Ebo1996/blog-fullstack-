import {
  Controller, Post, Get, Param, Body,
  Headers, RawBodyRequest, Req,
  HttpCode, HttpStatus, UseGuards, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from '../payments.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments/chapa')
export class ChapaController {
  private readonly logger = new Logger(ChapaController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /payments/chapa/verify/:reference
   * Called by the frontend after Chapa redirect returns.
   * Backend re-verifies with Chapa — never trusts frontend claim.
   */
  @Post('verify/:reference')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Verify payment by tx_ref (server-side)' })
  async verify(
    @Param('reference') reference: string,
    @CurrentUser('sub') userId: string,
  ) {
    const data = await this.paymentsService.verifyAndFulfill(reference, userId);
    return { success: true, data };
  }

  /**
   * POST /payments/chapa/webhook
   * Chapa sends this server-to-server — no JWT required.
   * Signature is validated inside the service.
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chapa webhook receiver' })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-chapa-signature') signature: string,
    @Body() body: any,
  ) {
    // Raw body is needed for HMAC verification
    const rawBody = req.rawBody?.toString() ?? JSON.stringify(body);
    await this.paymentsService.handleWebhook(rawBody, signature, body);
    return { received: true };
  }

  /**
   * GET /payments/chapa/callback
   * Chapa redirects user here after payment (success or failure).
   * This is an intermediate endpoint — frontend handles the actual redirect.
   */
  @Public()
  @Get('callback')
  @ApiOperation({ summary: 'Chapa callback URL (redirect handler)' })
  async callback() {
    // Frontend handles the UX via return_url
    return { message: 'Payment callback received' };
  }
}
