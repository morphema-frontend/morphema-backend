// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { UserSession } from './user-session.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    AuditModule,
    TypeOrmModule.forFeature([UserSession]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const secret =
          config.get<string>('JWT_ACCESS_SECRET') ||
          config.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_ACCESS_SECRET/JWT_SECRET is not set');
        }

        // TTL in secondi, default 900 = 15 minuti
        const ttl = config.get<number>('JWT_ACCESS_TTL') ?? 900;

        return {
          secret,
          signOptions: {
            expiresIn: ttl,
            issuer: config.get<string>('JWT_ISSUER') || 'morphema',
            audience: config.get<string>('JWT_AUDIENCE') || 'morphema-api',
          },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
