import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'skills' })
export class Skill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'jobTypeId', type: 'int' })
  jobTypeId: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'createdAt', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'updatedAt', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
