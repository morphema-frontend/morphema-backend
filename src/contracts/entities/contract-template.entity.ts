import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'contract_templates' })
export class ContractTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', default: 'v1' })
  version: string;

  @Column({ type: 'text', default: '' })
  body: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'timestamptz', default: () => 'now()', name: 'createdAt' })
  createdAt: Date;

  @Column({ type: 'timestamptz', default: () => 'now()', name: 'updatedAt' })
  updatedAt: Date;
}
