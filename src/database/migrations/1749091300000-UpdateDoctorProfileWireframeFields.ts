import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDoctorProfileWireframeFields1749091300000
  implements MigrationInterface
{
  name = 'UpdateDoctorProfileWireframeFields1749091300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
        ADD COLUMN IF NOT EXISTS "profile_image_url" character varying,
        ADD COLUMN IF NOT EXISTS "achievements" character varying,
        ADD COLUMN IF NOT EXISTS "services" text[],
        ADD COLUMN IF NOT EXISTS "availability" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
        ALTER COLUMN "license_number" DROP NOT NULL,
        ALTER COLUMN "specialization" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
        DROP COLUMN IF EXISTS "profile_image_url",
        DROP COLUMN IF EXISTS "achievements",
        DROP COLUMN IF EXISTS "services",
        DROP COLUMN IF EXISTS "availability"
    `);

    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
        ALTER COLUMN "license_number" SET NOT NULL,
        ALTER COLUMN "specialization" SET NOT NULL
    `);
  }
}
