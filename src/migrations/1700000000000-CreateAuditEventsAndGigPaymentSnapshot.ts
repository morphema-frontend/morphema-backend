import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditEventsAndGigPaymentSnapshot1700000000000
  implements MigrationInterface
{
  name = 'CreateAuditEventsAndGigPaymentSnapshot1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) audit_events (append-only)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id SERIAL PRIMARY KEY,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "actorUserId" integer NULL,
        "actorRole" varchar(16) NULL,
        "entityType" varchar(32) NOT NULL,
        "entityId" integer NULL,
        "action" varchar(64) NOT NULL,
        "payload" jsonb NULL,
        "ip" varchar(64) NULL,
        "userAgent" text NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS audit_events_createdAt_idx ON audit_events ("createdAt");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS audit_events_actorUserId_idx ON audit_events ("actorUserId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS audit_events_entityType_entityId_idx ON audit_events ("entityType","entityId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS audit_events_action_idx ON audit_events ("action");
    `);

    // 2) gigs.paymentSnapshot (needed for Stripe preauth snapshot)
    await queryRunner.query(`
      ALTER TABLE gigs
      ADD COLUMN IF NOT EXISTS "paymentSnapshot" jsonb NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // demo-safe: do not drop production-like data by default
    // If you really want rollback:
    // await queryRunner.query(`ALTER TABLE gigs DROP COLUMN IF EXISTS "paymentSnapshot";`);
    // await queryRunner.query(`DROP TABLE IF EXISTS audit_events;`);
  }
}
