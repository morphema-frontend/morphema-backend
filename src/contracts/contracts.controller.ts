import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ContractsService } from './contracts.service';

@Controller('contract-templates')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Get()
  async list() {
    return this.contracts.list();
  }

  @Post('seed')
  @Roles('admin')
  async seed() {
    return this.contracts.seed();
  }
}
