import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDoctorDiscoveryIndexes1749523200000
  implements MigrationInterface
{
  name = 'AddDoctorDiscoveryIndexes1749523200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_doctor_profiles_specialization_lower"
      ON "doctor_profiles" (LOWER("specialization"))
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_doctor_name_search"
      ON "users" (LOWER("first_name"), LOWER("last_name"))
      WHERE "user_type" = 'doctor'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_doctor_name_search"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_doctor_profiles_specialization_lower"
    `);
  }
}
