import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export type UserRole = 'horeca' | 'worker' | 'admin';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;

  @IsString()
  @IsIn(['horeca', 'worker', 'admin'])
  role: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
