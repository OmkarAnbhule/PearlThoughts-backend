import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOnboardingProfileFields1749264000000
  implements MigrationInterface
{
  name = 'AddOnboardingProfileFields1749264000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "first_name" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "last_name" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
      ADD COLUMN "qualification" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
      ADD COLUMN "availability" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
      DROP COLUMN "availability"
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
      DROP COLUMN "qualification"
    `);
    await queryRunner.query(`
      UPDATE "users"
      SET "first_name" = 'Unknown'
      WHERE "first_name" IS NULL
    `);
    await queryRunner.query(`
      UPDATE "users"
      SET "last_name" = 'Unknown'
      WHERE "last_name" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "first_name" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "last_name" SET NOT NULL
    `);
  }
}
