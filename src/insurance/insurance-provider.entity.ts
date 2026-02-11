import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'insurance_providers' })
export class InsuranceProvider {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', default: 'IT' })
  country: string;

  @Column({ type: 'timestamp', default: () => 'now()' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'now()' })
  updatedAt: Date;

  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive: boolean;
}
