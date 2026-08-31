import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUser = {
  _id: { toString: () => 'user-id-123' },
  name: 'Test User',
  email: 'test@example.com',
  passwordHash: '',
  role: 'attendee',
  isActive: true,
};

const mockUsersService = {
  findByEmailWithPassword: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateRefreshToken: jest.fn(),
  updateLastLogin: jest.fn(),
  setEmailVerified: jest.fn(),
  setPasswordResetToken: jest.fn(),
  updatePassword: jest.fn(),
  userModel: { findOne: jest.fn() },
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
};

const mockConfigService = {
  get: jest.fn((key: string, def?: any) => def ?? 'test-value'),
};

const mockAuditLogsService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditLogsService, useValue: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── validateUser ─────────────────────────────────────────────────
  describe('validateUser', () => {
    it('returns null when user not found', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(null);
      const result = await service.validateUser('x@x.com', 'pass');
      expect(result).toBeNull();
    });

    it('throws UnauthorizedException for suspended account', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue({
        ...mockUser,
        isActive: false,
        passwordHash: 'hash',
      });
      await expect(service.validateUser('test@example.com', 'pass'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('returns null for wrong password', async () => {
      const hash = await bcrypt.hash('correctpass', 10);
      mockUsersService.findByEmailWithPassword.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
      });
      const result = await service.validateUser('test@example.com', 'wrongpass');
      expect(result).toBeNull();
    });

    it('returns user for correct credentials', async () => {
      const hash = await bcrypt.hash('correctpass', 10);
      const user = { ...mockUser, passwordHash: hash };
      mockUsersService.findByEmailWithPassword.mockResolvedValue(user);
      const result = await service.validateUser('test@example.com', 'correctpass');
      expect(result).toBe(user);
    });
  });

  // ── login ─────────────────────────────────────────────────────────
  describe('login', () => {
    it('returns tokens and user, fires audit log', async () => {
      const user = { ...mockUser } as any;
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.login(user);
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.user).toBe(user);
      // Audit log fires (best-effort, give it a tick)
      await new Promise((r) => setTimeout(r, 10));
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.login' }),
      );
    });
  });

  // ── forgotPassword ───────────────────────────────────────────────
  describe('forgotPassword', () => {
    it('returns generic message regardless of whether user exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const result = await service.forgotPassword('nobody@example.com');
      expect(result.message).toContain('reset link has been sent');
    });

    it('sets reset token when user exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.setPasswordResetToken.mockResolvedValue(undefined);
      await service.forgotPassword('test@example.com');
      expect(mockUsersService.setPasswordResetToken).toHaveBeenCalled();
    });
  });

  // ── resetPassword ────────────────────────────────────────────────
  describe('resetPassword', () => {
    it('throws BadRequestException for invalid token', async () => {
      (mockUsersService as any).userModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });
      await expect(service.resetPassword('bad-token', 'newpass'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
