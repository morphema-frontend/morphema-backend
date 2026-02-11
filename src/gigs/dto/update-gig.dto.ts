import {
  IsInt,
  Min,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsISO8601,
  IsNumber,
  IsPositive,
  IsIn,
} from 'class-validator';

export class UpdateGigDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  venueId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  jobTypeId?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsISO8601()
  startTime?: string;

  @IsOptional()
  @IsISO8601()
  endTime?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  payAmount?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(['EUR'])
  currency?: string;
}
