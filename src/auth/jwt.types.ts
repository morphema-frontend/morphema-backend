// src/auth/jwt.types.ts
import { UserRole } from '../users/user.entity';

export type TokenType = 'access' | 'refresh';

export interface BaseJwtPayload {
  sub: number;      // user id
  role: UserRole;
  sessionId: string; // user_sessions.id
  tokenType: TokenType;
  jti: string;
}

export interface AccessTokenPayload extends BaseJwtPayload {
  tokenType: 'access';
}

export interface RefreshTokenPayload extends BaseJwtPayload {
  tokenType: 'refresh';
}
