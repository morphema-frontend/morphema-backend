import { IsArray, ArrayNotEmpty, IsInt, Min } from 'class-validator';

export class SetMySkillsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  skillIds: number[];
}
