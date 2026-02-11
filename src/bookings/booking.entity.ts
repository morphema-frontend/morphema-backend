import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

export enum BookingStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity({ name: 'bookings' })
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'gigId', type: 'int' })
  gigId: number;

  @Index()
  @Column({ name: 'venueId', type: 'int' })
  venueId: number;

  @Column({ name: 'createdByUserId', type: 'int', default: 1 })
  createdByUserId: number;

  @Column({ name: 'jobTypeId', type: 'int', nullable: true })
  jobTypeId: number | null;

  @Column({ name: 'workerUserId', type: 'int', nullable: true })
  workerUserId: number | null;

  @Index()
  @Column({
    type: 'enum',
    enum: BookingStatus,
    enumName: 'bookings_status_enum',
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ name: 'startsAt', type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'endsAt', type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @Column({ name: 'insuranceSnapshot', type: 'jsonb', nullable: true })
  insuranceSnapshot: unknown | null;

  @Column({ name: 'paymentSnapshot', type: 'jsonb', nullable: true })
  paymentSnapshot: unknown | null;

  @Column({ name: 'createdAt', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'updatedAt', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
