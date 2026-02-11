import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { PaymentsIntegration } from './payments.integration';

@Module({
  imports: [AuditModule],
  providers: [PaymentsIntegration],
  exports: [PaymentsIntegration],
})
export class PaymentsIntegrationModule {}
