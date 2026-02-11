import { Body, Controller, Get, Param, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  // Dev-only: ADMIN only
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('seed')
  async seed() {
    await this.insuranceService.seedDefaultCatalogIfEmpty();
    return { ok: true };
  }

  // products: ok public per MVP (serve a FE / debug)
  @Get('products')
  async products() {
    await this.insuranceService.seedDefaultCatalogIfEmpty();
    return this.insuranceService.listProducts();
  }

  // quote: ADMIN only (per ora)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('quote')
  async quote(
    @Body()
    dto: {
      bookingId: number;
      venueId: number;
      gigId: number;
      insuredUserId: number;
      productCode: string;
    },
  ) {
    await this.insuranceService.seedDefaultCatalogIfEmpty();
    return this.insuranceService.quote(dto);
  }

  // bind: ADMIN only (per ora)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('bind')
  async bind(
    @Body()
    dto: {
      bookingId: number;
      venueId: number;
      gigId: number;
      insuredUserId: number;
      productCode: string;
    },
  ) {
    await this.insuranceService.seedDefaultCatalogIfEmpty();
    return this.insuranceService.bind(dto);
  }

  // policies/user/:userId -> admin OR stesso utente
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('worker', 'venue', 'admin')
  @Get('policies/user/:userId')
  async policiesForUser(@Req() req: any, @Param('userId') userId: string) {
    const id = Number(userId);
    const actor = req.user;

    const isAdmin = actor?.role === 'admin';
    const isSelf = actor?.id === id;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('Cannot read policies for other users');
    }

    return this.insuranceService.listPoliciesForUser(id);
  }
}
