import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { InsuranceProvider } from './insurance-provider.entity';

export type InsuranceProductScope = 'job' | 'monthly' | 'annual';

@Entity({ name: 'insurance_products' })
export class InsuranceProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'varchar', default: 'job' })
  scope: InsuranceProductScope;

  @Column({ name: 'priceCents', type: 'int', default: 0 })
  priceCents: number;

  @Column({ type: 'varchar', default: 'EUR' })
  currency: string;

  @Column({ name: 'providerId', type: 'int' })
  providerId: number;

  // Unidirectional: no prov.products reference -> no TS error regardless of provider entity shape
  @ManyToOne(() => InsuranceProvider, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'providerId' })
  provider: InsuranceProvider;

  @Column({ name: 'createdAt', type: 'timestamp', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'updatedAt', type: 'timestamp', default: () => 'now()' })
  updatedAt: Date;

  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive: boolean;
}
