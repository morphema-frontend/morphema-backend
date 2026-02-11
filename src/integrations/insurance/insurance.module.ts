import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { InsuranceIntegration } from './insurance.integration';

@Module({
  imports: [AuditModule],
  providers: [InsuranceIntegration],
  exports: [InsuranceIntegration],
})
export class InsuranceIntegrationModule {}
