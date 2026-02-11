import { IsInt, Min } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  @Min(1)
  gigId: number;
}
