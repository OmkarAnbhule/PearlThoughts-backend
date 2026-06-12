import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowMultipleRecurringWindowsPerDay1749610400000
  implements MigrationInterface
{
  name = 'AllowMultipleRecurringWindowsPerDay1749610400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doctor_recurring_availability"
      DROP CONSTRAINT IF EXISTS "UQ_doctor_recurring_availability_doctor_day"
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_doctor_recurring_availability_doctor_day"
      ON "doctor_recurring_availability" ("doctor_profile_id", "day_of_week")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_doctor_recurring_availability_doctor_day"
    `);

    await queryRunner.query(`
      ALTER TABLE "doctor_recurring_availability"
      ADD CONSTRAINT "UQ_doctor_recurring_availability_doctor_day"
      UNIQUE ("doctor_profile_id", "day_of_week")
    `);
  }
}
