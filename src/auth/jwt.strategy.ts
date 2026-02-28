import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret =
      configService.get<string>('JWT_ACCESS_SECRET') ||
      configService.get<string>('JWT_SECRET');
    if (!secret) {
      // Fail fast: without this the app would accept "undefined" secret and types rightfully complain.
      throw new Error('Missing env JWT_ACCESS_SECRET/JWT_SECRET');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    if (!payload || payload.tokenType !== 'access') {
      throw new UnauthorizedException('Invalid token payload');
    }

    const userId = Number(payload.sub);
    if (!Number.isFinite(userId)) {
      throw new UnauthorizedException('Invalid user id');
    }

    const user = await this.usersService.findOneById(userId);
    if (!user || (user as any).isActive === false) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      sub: user.id,
      role: (user as any).role,
      sessionId: payload.sessionId,
      tokenType: payload.tokenType,
      jti: payload.jti,
    };
  }
}
