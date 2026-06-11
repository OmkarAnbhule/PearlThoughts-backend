import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDoctorAvailabilityOverrides1749610100000
  implements MigrationInterface
{
  name = 'CreateDoctorAvailabilityOverrides1749610100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."doctor_availability_overrides_override_type_enum" AS ENUM(
          'closed', 'modified', 'blocked'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "doctor_availability_overrides" (
        "id" uuid NOT NULL,
        "doctor_profile_id" uuid NOT NULL,
        "override_date" date NOT NULL,
        "override_type" "public"."doctor_availability_overrides_override_type_enum" NOT NULL,
        "start_time" TIME,
        "end_time" TIME,
        "blocked_start_time" TIME,
        "blocked_end_time" TIME,
        "reason" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doctor_availability_overrides" PRIMARY KEY ("id"),
        CONSTRAINT "FK_doctor_availability_overrides_doctor_profile_id"
          FOREIGN KEY ("doctor_profile_id")
          REFERENCES "doctor_profiles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_doctor_availability_overrides_doctor_date"
      ON "doctor_availability_overrides" ("doctor_profile_id", "override_date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_doctor_availability_overrides_doctor_date"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "doctor_availability_overrides"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."doctor_availability_overrides_override_type_enum"
    `);
  }
}
