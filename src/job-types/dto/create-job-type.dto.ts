import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { JobRiskLevel } from '../entities/job-type.entity';

export class CreateJobTypeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(JobRiskLevel)
  riskLevel: JobRiskLevel;

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
