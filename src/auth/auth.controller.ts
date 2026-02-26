// src/auth/auth.controller.ts
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Canonical auth contract:
  // POST /api/auth/register | /api/auth/signup
  // POST /api/auth/login
  // POST /api/auth/refresh
  // POST /api/auth/logout
  // GET  /api/auth/me
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: any) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] ?? '';
    return this.authService.register(dto.email, dto.password, dto.role, ip, userAgent);
  }

  @Post('signup')
  signup(@Body() dto: RegisterDto, @Req() req: any) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] ?? '';
    return this.authService.register(dto.email, dto.password, dto.role, ip, userAgent);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto, @Req() req: any) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] ?? '';
    return this.authService.login(
      loginDto.email,
      loginDto.password,
      ip,
      userAgent,
    );
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    const userId = req.user.id;
    const sessionId = req.user.sessionId;
    await this.authService.logout(sessionId, userId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(@Req() req: any) {
    const userId = req.user.id;
    await this.authService.logoutAll(userId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const userId = Number(req.user?.id ?? req.user?.sub);
    const sessionId = req.user?.sessionId ?? null;
    return this.authService.me(userId, sessionId);
  }
}
