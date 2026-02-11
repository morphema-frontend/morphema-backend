import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum JobRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

@Entity({ name: 'job_types' })
export class JobType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: JobRiskLevel,
    enumName: 'job_types_risklevel_enum',
  })
  riskLevel: JobRiskLevel;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  defaultInsuranceTierCode: string | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  minHourlyRate: number | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
