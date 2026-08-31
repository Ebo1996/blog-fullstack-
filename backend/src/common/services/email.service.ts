import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.from = configService.get<string>('EMAIL_FROM', 'Eventify Ethiopia <no-reply@eventify.et>');
    this.appUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: configService.get<number>('SMTP_PORT', 587),
      secure: configService.get<number>('SMTP_PORT', 587) === 465,
      auth: {
        user: configService.get<string>('SMTP_USER'),
        pass: configService.get<string>('SMTP_PASS'),
      },
    });
  }

  // ── Generic send ───────────────────────────────────────────────
  async send(to: string, subject: string, html: string): Promise<void> {
    // Skip sending if SMTP is not configured (dev/test environment)
    const smtpUser = this.configService.get<string>('SMTP_USER');
    if (!smtpUser) {
      this.logger.warn(`[EmailService] SMTP_USER not set — skipping email to ${to}: ${subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err?.message}`);
      // Don't throw — email failure should never crash the request
    }
  }

  // ── Email verification ─────────────────────────────────────────
  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const link = `${this.appUrl}/verify-email?token=${token}`;
    await this.send(
      to,
      'Verify your Eventify Ethiopia account',
      `
      <div style="font-family:sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#1a1a1a">Welcome to Eventify Ethiopia, ${name}!</h2>
        <p style="color:#555">Please verify your email address to activate your account.</p>
        <a href="${link}"
          style="display:inline-block;margin:24px 0;padding:12px 28px;background:#d7f36a;color:#1a1a1a;font-weight:700;border-radius:8px;text-decoration:none">
          Verify email address
        </a>
        <p style="color:#888;font-size:12px">
          Or copy this link: <a href="${link}" style="color:#666">${link}</a>
        </p>
        <p style="color:#888;font-size:12px">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
      `,
    );
  }

  // ── Password reset ─────────────────────────────────────────────
  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const link = `${this.appUrl}/reset-password?token=${token}`;
    await this.send(
      to,
      'Reset your Eventify Ethiopia password',
      `
      <div style="font-family:sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#1a1a1a">Password reset request</h2>
        <p style="color:#555">Hi ${name}, we received a request to reset your password.</p>
        <a href="${link}"
          style="display:inline-block;margin:24px 0;padding:12px 28px;background:#d7f36a;color:#1a1a1a;font-weight:700;border-radius:8px;text-decoration:none">
          Reset password
        </a>
        <p style="color:#888;font-size:12px">
          Or copy this link: <a href="${link}" style="color:#666">${link}</a>
        </p>
        <p style="color:#888;font-size:12px">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
      </div>
      `,
    );
  }
}
