import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateHorecaVenueDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  province: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  country: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  legalName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  vatNumber: string;
}
