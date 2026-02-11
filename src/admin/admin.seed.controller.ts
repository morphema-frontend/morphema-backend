import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ContractsService } from '../contracts/contracts.service';
import { InsuranceService } from '../insurance/insurance.service';

@Controller('admin/seed')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminSeedController {
  constructor(
    private readonly contracts: ContractsService,
    private readonly insurance: InsuranceService,
  ) {}

  @Post('contract-templates')
  async seedContractTemplates() {
    return this.contracts.seed();
  }

  @Post('insurance')
  async seedInsurance() {
    return this.insurance.seedDefaultCatalogIfEmpty();
  }
}
