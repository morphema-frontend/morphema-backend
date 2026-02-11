import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InsuranceProduct } from './insurance-product.entity';

@Entity({ name: 'insurance_providers' })
export class InsuranceProvider {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', default: 'IT' })
  country: string;

  @Column({ name: 'createdAt', type: 'timestamp', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'updatedAt', type: 'timestamp', default: () => 'now()' })
  updatedAt: Date;

  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => InsuranceProduct, (p) => p.provider)
  products: InsuranceProduct[];
}
