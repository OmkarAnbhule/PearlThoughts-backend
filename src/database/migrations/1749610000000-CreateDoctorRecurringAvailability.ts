import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDoctorRecurringAvailability1749610000000
  implements MigrationInterface
{
  name = 'CreateDoctorRecurringAvailability1749610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "doctor_recurring_availability" (
        "id" uuid NOT NULL,
        "doctor_profile_id" uuid NOT NULL,
        "day_of_week" smallint NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doctor_recurring_availability" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_doctor_recurring_availability_day_of_week"
          CHECK ("day_of_week" >= 0 AND "day_of_week" <= 6),
        CONSTRAINT "CHK_doctor_recurring_availability_time_range"
          CHECK ("start_time" < "end_time"),
        CONSTRAINT "FK_doctor_recurring_availability_doctor_profile_id"
          FOREIGN KEY ("doctor_profile_id")
          REFERENCES "doctor_profiles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_doctor_recurring_availability_doctor_profile_id"
      ON "doctor_recurring_availability" ("doctor_profile_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_doctor_recurring_availability_doctor_day"
      ON "doctor_recurring_availability" ("doctor_profile_id", "day_of_week")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_doctor_recurring_availability_doctor_day"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_doctor_recurring_availability_doctor_profile_id"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "doctor_recurring_availability"
    `);
  }
}
