import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InsuranceProduct } from './insurance-product.entity';

export type InsurancePolicyStatus = 'pending' | 'active' | 'expired' | 'cancelled';
export type InsuranceHolderType = 'user' | 'venue';

@Entity('insurance_policies')
@Index(['holderType', 'holderId'])
@Index(['bookingId'])
export class InsurancePolicy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  holderType: InsuranceHolderType;

  @Column({ type: 'int' })
  holderId: number;

  @Column({ type: 'int' })
  bookingId: number;

  @Column({ type: 'varchar', default: 'pending' })
  status: InsurancePolicyStatus;

  @Column({ type: 'int' })
  premiumCents: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  documents: Record<string, any> | null;

  @ManyToOne(() => InsuranceProduct, (p: any) => p.policies, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  product: InsuranceProduct;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
