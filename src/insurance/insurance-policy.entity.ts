import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { InsuranceProduct } from './insurance-product.entity';

export type InsurancePolicyStatus = 'pending' | 'active' | 'expired' | 'cancelled';
export type InsuranceHolderType = 'user' | 'venue';

@Entity({ name: 'insurance_policies' })
@Index(['holderType', 'holderId'])
@Index(['bookingId'])
export class InsurancePolicy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'bookingId', type: 'int' })
  bookingId: number;

  @Column({ type: 'varchar', default: 'pending' })
  status: InsurancePolicyStatus;

  @Column({ name: 'createdAt', type: 'timestamp', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'updatedAt', type: 'timestamp', default: () => 'now()' })
  updatedAt: Date;

  @Column({ name: 'productId', type: 'int' })
  productId: number;

  // Unidirectional: no p.policies reference -> avoids split-brain entity mismatch
  @ManyToOne(() => InsuranceProduct, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product: InsuranceProduct;

  @Column({ name: 'premiumCents', type: 'int' })
  premiumCents: number;

  @Column({ name: 'holderType', type: 'varchar' })
  holderType: InsuranceHolderType;

  @Column({ name: 'holderId', type: 'int' })
  holderId: number;

  @Column({ type: 'jsonb', nullable: true })
  documents: Record<string, any> | null;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;
}
