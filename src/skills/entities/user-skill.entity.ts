import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_skills' })
@Index(['userId', 'skillId'], { unique: true })
export class UserSkill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'userId', type: 'int' })
  userId: number;

  @Column({ name: 'skillId', type: 'int' })
  skillId: number;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamptz' })
  createdAt: Date;
}
