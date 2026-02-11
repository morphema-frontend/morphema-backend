// src/gigs/dto/create-gig.dto.ts
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateGigDto {
  @IsInt()
  @IsPositive()
  venueId!: number;

  @IsInt()
  @IsPositive()
  jobTypeId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  // ISO string
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  // ISO string
  @IsString()
  @IsNotEmpty()
  endTime!: string;

  /**
   * IMPORTANT:
   * payAmount = TOTALE gig (worker + insurance + fee) in EUR.
   * DB column is numeric -> entity uses string, service converte.
   */
  @ValidateIf((o) => o.payAmount !== undefined && o.payAmount !== null)
  @Min(0)
  payAmount?: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  // Optional: override default insurance product
  @IsOptional()
  @IsInt()
  @IsPositive()
  insuranceProductId?: number;

  // Optional: override contract template
  @IsOptional()
  @IsInt()
  @IsPositive()
  contractTemplateId?: number;
}
