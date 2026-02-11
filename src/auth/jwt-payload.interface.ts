// src/auth/jwt-payload.interface.ts
export type UserRole = 'horeca' | 'worker' | 'admin';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
