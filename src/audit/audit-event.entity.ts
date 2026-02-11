import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'audit_events' })
export class AuditEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'createdAt', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Index()
  @Column({ name: 'actorUserId', type: 'int', nullable: true })
  actorUserId: number | null;

  @Column({ name: 'actorRole', type: 'varchar', length: 16, nullable: true })
  actorRole: string | null;

  @Index()
  @Column({ name: 'entityType', type: 'varchar', length: 32 })
  entityType: string;

  @Index()
  @Column({ name: 'entityId', type: 'int', nullable: true })
  entityId: number | null;

  @Index()
  @Column({ name: 'action', type: 'varchar', length: 64 })
  action: string;

  @Column({ name: 'payload', type: 'jsonb', nullable: true })
  payload: unknown | null;

  @Column({ name: 'ip', type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @Column({ name: 'userAgent', type: 'text', nullable: true })
  userAgent: string | null;
}
