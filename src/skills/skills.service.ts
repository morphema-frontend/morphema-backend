import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';
import { UserSkill } from './entities/user-skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    @InjectRepository(UserSkill)
    private readonly userSkillsRepository: Repository<UserSkill>,
  ) {}

  async listActiveSkills(): Promise<Skill[]> {
    return this.skillsRepository.find({
      where: { active: true },
      order: { id: 'ASC' },
    });
  }

  async getUserSkillIds(userId: number): Promise<number[]> {
    const rows = await this.userSkillsRepository.find({ where: { userId } });
    return rows.map((r) => r.skillId);
  }

  async replaceUserSkills(userId: number, skillIds: number[]): Promise<number[]> {
    const unique = Array.from(new Set(skillIds));
    if (unique.length !== skillIds.length) {
      throw new BadRequestException('Duplicate skillIds');
    }

    const existing = await this.skillsRepository.find({
      where: { id: In(unique), active: true },
    });
    if (existing.length !== unique.length) {
      throw new BadRequestException('One or more skillIds are invalid');
    }

    await this.userSkillsRepository.delete({ userId });
    const entities = unique.map((skillId) =>
      this.userSkillsRepository.create({ userId, skillId }),
    );
    await this.userSkillsRepository.save(entities);

    return unique;
  }
}
