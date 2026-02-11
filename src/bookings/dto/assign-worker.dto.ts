import { IsInt, Min } from 'class-validator';

export class AssignWorkerDto {
  @IsInt()
  @Min(1)
  workerUserId!: number;
}
