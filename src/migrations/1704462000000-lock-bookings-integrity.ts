import { MigrationInterface, QueryRunner } from 'typeorm';

export class LockBookingsIntegrity1704462000000 implements MigrationInterface {
  name = 'LockBookingsIntegrity1704462000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Deterministic placeholders (tables confirmed to exist)
    const venue = await queryRunner.query(
      `SELECT id FROM horeca_venues ORDER BY id ASC LIMIT 1`
    );
    const gig = await queryRunner.query(
      `SELECT id FROM gigs ORDER BY id ASC LIMIT 1`
    );
    const user = await queryRunner.query(
      `SELECT id FROM "user" ORDER BY id ASC LIMIT 1`
    );

    if (!venue.length) throw new Error('Cannot sanitize bookings: horeca_venues has no rows.');
    if (!gig.length) throw new Error('Cannot sanitize bookings: gigs has no rows.');
    if (!user.length) throw new Error('Cannot sanitize bookings: user table has no rows.');

    const venueId = venue[0].id;
    const gigId = gig[0].id;
    const userId = user[0].id;

    // 2) Sanitize historical corrupt data (NO DELETE)
    await queryRunner.query(
      `UPDATE bookings SET "venueId" = $1 WHERE "venueId" IS NULL`,
      [venueId]
    );
    await queryRunner.query(
      `UPDATE bookings SET "gigId" = $1 WHERE "gigId" IS NULL`,
      [gigId]
    );
    await queryRunner.query(
      `UPDATE bookings SET "createdByUserId" = $1 WHERE "createdByUserId" IS NULL`,
      [userId]
    );

    // 3) Enforce NOT NULL at DB level (this is what was crashing you)
    await queryRunner.query(`ALTER TABLE bookings ALTER COLUMN "venueId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE bookings ALTER COLUMN "gigId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE bookings ALTER COLUMN "createdByUserId" SET NOT NULL`);

    // 4) Foreign keys (now pointing to REAL tables)
    await queryRunner.query(`
      ALTER TABLE bookings
      ADD CONSTRAINT fk_bookings_venue
      FOREIGN KEY ("venueId") REFERENCES horeca_venues(id)
      ON UPDATE CASCADE ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE bookings
      ADD CONSTRAINT fk_bookings_gig
      FOREIGN KEY ("gigId") REFERENCES gigs(id)
      ON UPDATE CASCADE ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE bookings
      ADD CONSTRAINT fk_bookings_created_by
      FOREIGN KEY ("createdByUserId") REFERENCES "user"(id)
      ON UPDATE CASCADE ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE bookings
      ADD CONSTRAINT fk_bookings_worker
      FOREIGN KEY ("workerUserId") REFERENCES "user"(id)
      ON UPDATE CASCADE ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE bookings DROP CONSTRAINT fk_bookings_worker`);
    await queryRunner.query(`ALTER TABLE bookings DROP CONSTRAINT fk_bookings_created_by`);
    await queryRunner.query(`ALTER TABLE bookings DROP CONSTRAINT fk_bookings_gig`);
    await queryRunner.query(`ALTER TABLE bookings DROP CONSTRAINT fk_bookings_venue`);

    await queryRunner.query(`ALTER TABLE bookings ALTER COLUMN "venueId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE bookings ALTER COLUMN "gigId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE bookings ALTER COLUMN "createdByUserId" DROP NOT NULL`);
  }
}