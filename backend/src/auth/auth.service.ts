import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../common/decorators/roles.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // ─── Validate local credentials ────────────────────────────────
  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user || !user.passwordHash) return null;
    if (!user.isActive) throw new UnauthorizedException('Account is suspended');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return null;

    return user;
  }

  // ─── Register ──────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Only allow attendee/organizer self-registration; admin is created separately
    const role =
      dto.role === UserRole.ADMIN ? UserRole.ATTENDEE : (dto.role ?? UserRole.ATTENDEE);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role,
      emailVerificationToken: verificationToken,
    });

    // TODO: send verification email via NotificationsService
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);
    await this.usersService.updateLastLogin(user._id.toString());

    return {
      user,
      ...tokens,
    };
  }

  // ─── Login ─────────────────────────────────────────────────────
  async login(user: UserDocument) {
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);
    await this.usersService.updateLastLogin(user._id.toString());

    // Audit log
    this.auditLogsService.log({
      userId: user._id.toString(),
      action: 'auth.login',
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { role: user.role },
    }).catch(() => {});

    return { user, ...tokens };
  }

  // ─── Logout ────────────────────────────────────────────────────
  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  // ─── Get current user ──────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  // ─── Refresh tokens ────────────────────────────────────────────
  async refreshTokens(userId: string, _email: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(userId, tokens.refreshToken);
    return tokens;
  }

  // ─── Verify email ──────────────────────────────────────────────
  async verifyEmail(token: string) {
    const user = await this.usersService['userModel']
      .findOne({ emailVerificationToken: token })
      .select('+emailVerificationToken');

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.usersService.setEmailVerified(user._id.toString());
    return { message: 'Email verified successfully' };
  }

  // ─── Forgot password ───────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    // Always return success to prevent user enumeration
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.usersService.setPasswordResetToken(
      user._id.toString(),
      token,
      expires,
    );

    // TODO: send reset email via NotificationsService
    return { message: 'If that email exists, a reset link has been sent' };
  }

  // ─── Reset password ────────────────────────────────────────────
  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService['userModel']
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      })
      .select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.usersService.updatePassword(user._id.toString(), passwordHash);
    // Invalidate all refresh tokens on password reset
    await this.usersService.updateRefreshToken(user._id.toString(), null);

    return { message: 'Password reset successfully' };
  }

  // ─── Helpers ──────────────────────────────────────────────────
  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
