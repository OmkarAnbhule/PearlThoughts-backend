import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureDoctorProfileColumns1749700000000
  implements MigrationInterface
{
  name = 'EnsureDoctorProfileColumns1749700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
        ADD COLUMN IF NOT EXISTS "profile_image_url" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
        ADD COLUMN IF NOT EXISTS "achievements" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
        ADD COLUMN IF NOT EXISTS "services" text[]
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
        ADD COLUMN IF NOT EXISTS "availability" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
        ADD COLUMN IF NOT EXISTS "qualification" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
        DROP COLUMN IF EXISTS "qualification"
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
        DROP COLUMN IF EXISTS "availability"
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
        DROP COLUMN IF EXISTS "services"
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
        DROP COLUMN IF EXISTS "achievements"
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
        DROP COLUMN IF EXISTS "profile_image_url"
    `);
  }
}
