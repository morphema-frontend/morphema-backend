// src/gigs/gigs.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Gig } from './gig.entity';
import { GigsController } from './gigs.controller';
import { GigsService } from './gigs.service';

import { AuditModule } from '../audit/audit.module';
import { InsuranceModule } from '../insurance/insurance.module';
import { JobTypesModule } from '../job-types/job-types.module';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gig]),
    AuditModule,
    InsuranceModule,
    JobTypesModule,
    ContractsModule,
  ],
  controllers: [GigsController],
  providers: [GigsService],
  exports: [GigsService],
})
export class GigsModule {}
