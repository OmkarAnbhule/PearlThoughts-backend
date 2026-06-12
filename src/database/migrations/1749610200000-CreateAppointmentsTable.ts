import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppointmentsTable1749610200000 implements MigrationInterface {
  name = 'CreateAppointmentsTable1749610200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."appointments_status_enum" AS ENUM(
          'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appointments" (
        "id" uuid NOT NULL,
        "doctor_profile_id" uuid NOT NULL,
        "patient_user_id" uuid NOT NULL,
        "scheduled_start" TIMESTAMP WITH TIME ZONE NOT NULL,
        "scheduled_end" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'confirmed',
        "notes" text,
        "cancelled_at" TIMESTAMP WITH TIME ZONE,
        "cancellation_reason" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_appointments_time_range"
          CHECK ("scheduled_start" < "scheduled_end"),
        CONSTRAINT "FK_appointments_doctor_profile_id"
          FOREIGN KEY ("doctor_profile_id")
          REFERENCES "doctor_profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_appointments_patient_user_id"
          FOREIGN KEY ("patient_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_appointments_doctor_scheduled_start"
      ON "appointments" ("doctor_profile_id", "scheduled_start")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_appointments_patient_scheduled_start"
      ON "appointments" ("patient_user_id", "scheduled_start")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_appointments_doctor_active_slot"
      ON "appointments" ("doctor_profile_id", "scheduled_start")
      WHERE "status" IN ('pending', 'confirmed')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_appointments_doctor_active_slot"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_appointments_patient_scheduled_start"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_appointments_doctor_scheduled_start"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "appointments"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."appointments_status_enum"
    `);
  }
}
