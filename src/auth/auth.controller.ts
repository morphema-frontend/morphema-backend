// src/auth/auth.controller.ts
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}