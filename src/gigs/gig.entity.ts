import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum GigStatus {
  OPEN = 'open',
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export type GigPublishStatus = 'draft' | 'preauthorized' | 'published';

@Entity({ name: 'gigs' })
export class Gig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  publicId: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int' })
  venueId: number;

  @Column({ type: 'int', nullable: true })
  jobTypeId: number | null;

  @Column({
    type: 'enum',
    enum: GigStatus,
    enumName: 'gigs_status_enum',
    default: GigStatus.OPEN,
  })
  status: GigStatus;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column({ type: 'numeric', nullable: true })
  payAmount: string | null;

  @Column({ type: 'varchar', default: 'EUR' })
  currency: string;

  // --- Insurance (DDL) ---
  @Column({ type: 'int', nullable: true })
  insuranceProductId: number | null;

  @Column({ type: 'jsonb', nullable: true })
  insuranceSnapshot: any | null;

  // --- Contract (DDL) ---
  @Column({ type: 'int', nullable: true })
  contractTemplateId: number | null;

  @Column({ type: 'jsonb', nullable: true })
  contractSnapshot: any | null;

  // --- Publish gating (DDL) ---
  @Column({ type: 'varchar', length: 16, default: 'draft' })
  publishStatus: GigPublishStatus;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  /**
   * Stripe preauth snapshot (JSON).
   * Requires DB column: gigs.paymentSnapshot jsonb (additive migration).
   */
  @Column({ type: 'jsonb', nullable: true })
  paymentSnapshot: any | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
