// src/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import {
  Repository,
  IsNull,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { UserSession } from './user-session.entity';
import { AccessTokenPayload, RefreshTokenPayload } from './jwt.types';
import { AuditService } from '../audit/audit.service';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    role: User['role'];
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshSecret: string;
  private readonly refreshTtlMs: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(UserSession)
    private readonly sessionsRepo: Repository<UserSession>,
    private readonly configService: ConfigService,
    private readonly audit: AuditService,
  ) {
    const secret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET/JWT_SECRET is not set');
    }
    this.refreshSecret = secret;

    // per ora TTL refresh fisso: 7 giorni
    this.refreshTtlMs = 7 * 24 * 60 * 60 * 1000;
  }

  private sanitizeUser(user: User): AuthResult['user'] {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private async issueTokens(
    user: User,
    sessionId: string,
  ): Promise<AuthTokens> {
    this.logger.log(`issueTokens start userId=${user.id} sessionId=${sessionId}`);
    const jtiAccess = randomUUID();
    const jtiRefresh = randomUUID();

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      role: user.role,
      sessionId,
      tokenType: 'access',
      jti: jtiAccess,
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      role: user.role,
      sessionId,
      tokenType: 'refresh',
      jti: jtiRefresh,
    };

    let accessToken: string;
    let refreshToken: string;
    try {
      accessToken = await this.jwtService.signAsync(accessPayload);
      refreshToken = await this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshSecret,
        expiresIn: '7d',
      });
    } catch (err: any) {
      this.logger.error('issueTokens failed', err?.stack || err);
      throw err;
    }

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(
    token: string,
  ): Promise<{ payload: RefreshTokenPayload; session: UserSession }> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
        code: 'AUTH_INVALID',
      });
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException({
        message: 'Invalid token type',
        code: 'AUTH_INVALID',
      });
    }

    const session = await this.sessionsRepo.findOne({
      where: { id: payload.sessionId, userId: payload.sub },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException({
        message: 'Refresh session invalid or expired',
        code: 'AUTH_INVALID',
      });
    }

    if (!session.refreshTokenHash) {
      throw new UnauthorizedException({
        message: 'Refresh token mismatch',
        code: 'AUTH_INVALID',
      });
    }

    let matches = false;
    try {
      matches = await bcrypt.compare(token, session.refreshTokenHash);
    } catch (err: any) {
      this.logger.error('bcrypt.compare failed (refresh)', err?.stack || err);
      throw new UnauthorizedException({
        message: 'Refresh token mismatch',
        code: 'AUTH_INVALID',
      });
    }
    if (!matches) {
      throw new UnauthorizedException({
        message: 'Refresh token mismatch',
        code: 'AUTH_INVALID',
      });
    }

    return { payload, session };
  }

  async login(
    email: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResult> {
    if (!email || !password) {
      this.logger.log(`login.input invalid hasEmail=${!!email} hasPassword=${!!password}`);
      throw new BadRequestException({
        message: 'Email and password are required',
        code: 'BAD_REQUEST',
      });
    }
    this.logger.log(`login.input ok hasEmail=${!!email} hasPassword=${!!password}`);

    const user = await this.usersService.findOneByEmail(email);
    this.logger.log(
      `login.lookup userFound=${!!user} isActive=${!!user?.isActive} hasPasswordHash=${!!user?.password}`,
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: 'AUTH_INVALID',
      });
    }

    if (!user.password) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: 'AUTH_INVALID',
      });
    }

    let passwordMatches = false;
    try {
      passwordMatches = await bcrypt.compare(password, user.password);
    } catch (err: any) {
      this.logger.error('bcrypt.compare failed', err?.stack || err);
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: 'AUTH_INVALID',
      });
    }
    this.logger.log(`login.passwordCompare matches=${passwordMatches}`);
    if (!passwordMatches) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: 'AUTH_INVALID',
      });
    }

    const tempSession = this.sessionsRepo.create({
      userId: user.id,
      refreshTokenHash: '',
      expiresAt: new Date(Date.now() + this.refreshTtlMs),
      revokedAt: null,
      ip: ip ?? null,
      userAgent: userAgent ?? null,
    });
    const session = await this.sessionsRepo.save(tempSession);
    this.logger.log(`login.session created sessionId=${session.id}`);

    const { accessToken, refreshToken } = await this.issueTokens(
      user,
      session.id,
    );

    session.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.sessionsRepo.save(session);
    this.logger.log(`login.session updated sessionId=${session.id}`);

    await this.audit.log({
      actor: { sub: user.id, role: user.role as any },
      entityType: 'session',
      entityId: null,
      action: 'login',
      payload: { ip: ip ?? null, sessionId: session.id },
      ip: ip ?? null,
      userAgent: userAgent ?? null,
    });
    this.logger.log(`login.audit logged userId=${user.id} sessionId=${session.id}`);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async register(
    email: string,
    password: string,
    role: User['role'],
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResult> {
    if (!email || !password) {
      this.logger.log(`register.input invalid hasEmail=${!!email} hasPassword=${!!password}`);
      throw new BadRequestException({
        message: 'Email and password are required',
        code: 'BAD_REQUEST',
      });
    }
    this.logger.log(`register.input ok hasEmail=${!!email} hasPassword=${!!password}`);

    let created: User;
    try {
      created = await this.usersService.create({ email, password, role });
    } catch (err: any) {
      if (err instanceof HttpException && err.getStatus() < 500) {
        this.logger.warn(`register.create failed status=${err.getStatus()}`);
      } else {
        this.logger.error('register.create failed', err?.stack || err);
      }
      throw err;
    }
    this.logger.log(`register.user created userId=${created.id}`);
    await this.audit.log({
      actor: { sub: created.id, role: created.role as any },
      entityType: 'user',
      entityId: created.id,
      action: 'register',
      payload: { email: created.email },
      ip: ip ?? null,
      userAgent: userAgent ?? null,
    });
    this.logger.log(`register.audit logged userId=${created.id}`);
    return this.login(email, password, ip, userAgent);
  }

  async me(
    userId: number,
    sessionId: string | null,
  ): Promise<AuthResult['user'] & { sessionId: string | null }> {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        message: 'User not found or inactive',
        code: 'AUTH_INVALID',
      });
    }

    return {
      ...this.sanitizeUser(user),
      sessionId,
    };
  }

  async refresh(refreshToken: string, ip?: string, userAgent?: string): Promise<AuthResult> {
    const { payload, session } = await this.verifyRefreshToken(refreshToken);

    const user = await this.usersService.findOneById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        message: 'User not found or inactive',
        code: 'AUTH_INVALID',
      });
    }

    session.revokedAt = new Date();
    await this.sessionsRepo.save(session);

    const newSession = await this.sessionsRepo.save(
      this.sessionsRepo.create({
        userId: user.id,
        refreshTokenHash: '',
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
        revokedAt: null,
      }),
    );

    const { accessToken, refreshToken: newRefreshToken } =
      await this.issueTokens(user, newSession.id);

    newSession.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await this.sessionsRepo.save(newSession);

    await this.audit.log({
      actor: { sub: user.id, role: user.role as any },
      entityType: 'session',
      entityId: null,
      action: 'refresh',
      payload: { sessionId: newSession.id },
      ip: ip ?? null,
      userAgent: userAgent ?? null,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async logout(
    sessionId: string,
    userId: number,
    role?: User['role'],
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) {
      return;
    }
    if (!session.revokedAt) {
      session.revokedAt = new Date();
      await this.sessionsRepo.save(session);
    }
    await this.audit.log({
      actor: role ? { sub: userId, role: role as any } : undefined,
      entityType: 'session',
      entityId: null,
      action: 'logout',
      payload: { sessionId },
      ip: ip ?? null,
      userAgent: userAgent ?? null,
    });
  }

  async logoutAll(userId: number, role?: User['role']): Promise<void> {
    await this.sessionsRepo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    await this.audit.log({
      actor: role ? { sub: userId, role: role as any } : undefined,
      entityType: 'session',
      entityId: null,
      action: 'logout_all',
      payload: {},
    });
  }
}
