import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDoctorQualificationColumn1749350400000
  implements MigrationInterface
{
  name = 'AddDoctorQualificationColumn1749350400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }
}
