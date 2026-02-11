import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { JobRiskLevel } from '../entities/job-type.entity';

export class UpdateJobTypeDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(JobRiskLevel)
  @IsOptional()
  riskLevel?: JobRiskLevel;

  @IsString()
  @IsOptional()
  defaultInsuranceTierCode?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minHourlyRate?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
