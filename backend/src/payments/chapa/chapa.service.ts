import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  ChapaInitializePayload,
  ChapaInitializeResponse,
  ChapaVerifyResponse,
} from './chapa.types';

@Injectable()
export class ChapaService {
  private readonly logger = new Logger(ChapaService.name);
  private readonly http: AxiosInstance;
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('CHAPA_SECRET_KEY') ?? '';
    this.baseUrl = this.configService.get<string>(
      'CHAPA_BASE_URL',
    ) ?? 'https://api.chapa.co/v1';

    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  /**
   * Initialize a Chapa payment.
   * Returns the checkout URL to redirect the user to.
   */
  async initialize(payload: ChapaInitializePayload): Promise<ChapaInitializeResponse> {
    try {
      const response = await this.http.post<ChapaInitializeResponse>(
        '/transaction/initialize',
        payload,
      );
      return response.data;
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.response?.data || error.message;
      this.logger.error(
        `Chapa initialize failed: ${JSON.stringify(errorMsg)}`,
      );
      this.logger.error(`Payload sent: ${JSON.stringify(payload)}`);
      throw new InternalServerErrorException(
        'Payment initialization failed. Please try again.',
      );
    }
  }

  /**
   * Verify a transaction server-side.
   * NEVER trust status from the frontend — always verify here.
   */
  async verify(txRef: string): Promise<ChapaVerifyResponse> {
    try {
      const response = await this.http.get<ChapaVerifyResponse>(
        `/transaction/verify/${txRef}`,
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Chapa verify failed for ${txRef}: ${error?.response?.data?.message ?? error.message}`,
      );
      throw new InternalServerErrorException('Payment verification failed.');
    }
  }

  /**
   * Verify webhook HMAC signature.
   * Chapa signs webhook payloads — validate before processing.
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const webhookSecret = this.configService.get<string>('CHAPA_WEBHOOK_SECRET', '');
    if (!webhookSecret) {
      this.logger.warn('CHAPA_WEBHOOK_SECRET not configured — skipping signature check');
      return true;
    }
    const computed = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  }
}
