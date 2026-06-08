import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeDoctorProfileFieldsNullable1749177600000
  implements MigrationInterface
{
  name = 'MakeDoctorProfileFieldsNullable1749177600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
      ALTER COLUMN "license_number" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
      ALTER COLUMN "specialization" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "doctor_profiles"
      SET "license_number" = 'UNKNOWN'
      WHERE "license_number" IS NULL
    `);
    await queryRunner.query(`
      UPDATE "doctor_profiles"
      SET "specialization" = 'Unknown'
      WHERE "specialization" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
      ALTER COLUMN "license_number" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
      ALTER COLUMN "specialization" SET NOT NULL
    `);
  }
}
