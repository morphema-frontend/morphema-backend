export class CreateInsuranceProductDto {
  providerId!: string;

  code!: string;
  name!: string;

  scope!: 'WORKER' | 'VENUE';
  pricingModel!: 'PER_JOB' | 'MONTHLY' | 'ANNUAL';

  basePriceEUR?: number;
  terms?: Record<string, any>;
}
