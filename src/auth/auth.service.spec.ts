import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Repository } from 'typeorm';

import { AuthService } from './auth.service';
import { UserSession } from './user-session.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(async () => 'hashed'),
}));

describe('AuthService', () => {
  const usersService = {
    findOneByEmail: jest.fn(),
    findOneById: jest.fn(),
    create: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
  };
  const sessionsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  } as unknown as Repository<UserSession>;
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      if (key === 'JWT_ACCESS_TTL') return 900;
      return undefined;
    }),
  };
  const auditService = {
    log: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      usersService as any,
      jwtService as any,
      sessionsRepo,
      configService as any,
      auditService as any,
    );
  });

  it('rejects missing fields', async () => {
    await expect(service.login('', '')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects wrong credentials', async () => {
    usersService.findOneByEmail.mockResolvedValueOnce(null);
    await expect(service.login('user@example.com', 'Password123!')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects users with null password hash', async () => {
    usersService.findOneByEmail.mockResolvedValueOnce({
      id: 1,
      email: 'user@example.com',
      role: 'worker',
      isActive: true,
      password: null,
    });
    await expect(service.login('user@example.com', 'Password123!')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns tokens on valid credentials', async () => {
    usersService.findOneByEmail.mockResolvedValueOnce({
      id: 2,
      email: 'user@example.com',
      role: 'worker',
      isActive: true,
      password: 'hashed',
    });

    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    sessionsRepo.create = jest.fn(() => ({
      id: 'session-id',
      refreshTokenHash: '',
      expiresAt: new Date(),
      revokedAt: null,
    })) as any;
    sessionsRepo.save = jest.fn(async (session: any) => ({
      ...session,
      id: session.id || 'session-id',
    })) as any;

    const result = await service.login('user@example.com', 'Password123!');

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.email).toBe('user@example.com');
  });
});
