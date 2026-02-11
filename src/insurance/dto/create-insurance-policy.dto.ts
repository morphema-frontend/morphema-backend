export class CreateInsurancePolicyDto {
  productId!: string;

  holderType!: 'USER' | 'VENUE';
  holderId!: string;

  // Per modello PER_JOB (collegheremo a Booking dopo)
  jobRef?: string;

  validFrom?: string;
  validTo?: string;

  metadata?: Record<string, any>;
}
