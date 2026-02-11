// src/users/users.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UsersService } from './users.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AccessTokenPayload } from '../auth/jwt.types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * /users/me
   * - Protetto da AuthGuard('jwt') → passa dalla JwtStrategy
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Req() req: any) {
    const payload = req.user as AccessTokenPayload;

    const user = await this.usersService.findOneById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: payload.sessionId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _devTokenDebug: {
        sub: payload.sub,
        role: payload.role,
        sessionId: payload.sessionId,
        tokenType: payload.tokenType,
      },
    };
  }

  /**
   * Endpoint di debug per vedere gli header (NON protetto)
   */
  @Get('debug-headers')
  debugHeaders(@Req() req: any) {
    return {
      rawAuthorization: req.headers['authorization'] || req.headers['Authorization'],
      allHeaders: req.headers,
    };
  }
}
