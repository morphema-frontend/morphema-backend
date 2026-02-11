import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('horeca_venues')
export class HorecaVenue {
  @PrimaryGeneratedColumn()
  id: number;

  // DB: "publicId" varchar NOT NULL UNIQUE
  @Index({ unique: true })
  @Column({ name: 'publicId', type: 'varchar' })
  publicId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  address: string;

  @Column({ type: 'varchar' })
  city: string;

  // DB: "zipCode" varchar NOT NULL
  @Column({ name: 'zipCode', type: 'varchar' })
  zipCode: string;

  @Column({ type: 'varchar' })
  province: string;

  @Column({ type: 'varchar' })
  country: string;

  // DB: "legalName" varchar NOT NULL
  @Column({ name: 'legalName', type: 'varchar' })
  legalName: string;

  // DB: "vatNumber" varchar NOT NULL
  @Column({ name: 'vatNumber', type: 'varchar' })
  vatNumber: string;

  // DB: "ownerId" int NOT NULL
  @Column({ name: 'ownerId', type: 'int' })
  ownerId: number;

  // DB: status varchar NOT NULL default 'active'
  @Column({ type: 'varchar', default: 'active' })
  status: string;

  // DB: "createdAt" default now()
  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt: Date;

  // DB: "updatedAt" default now()
  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt: Date;
}
