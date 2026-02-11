import { Module } from '@nestjs/common';

import { ContractsModule } from '../contracts/contracts.module';
import { InsuranceModule } from '../insurance/insurance.module';
import { AdminSeedController } from './admin.seed.controller';

@Module({
  imports: [ContractsModule, InsuranceModule],
  controllers: [AdminSeedController],
})
export class AdminModule {}
