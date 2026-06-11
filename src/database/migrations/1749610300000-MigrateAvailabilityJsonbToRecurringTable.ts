import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateAvailabilityJsonbToRecurringTable1749610300000
  implements MigrationInterface
{
  name = 'MigrateAvailabilityJsonbToRecurringTable1749610300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "doctor_recurring_availability" (
        "id",
        "doctor_profile_id",
        "day_of_week",
        "start_time",
        "end_time",
        "created_at",
        "updated_at"
      )
      SELECT
        gen_random_uuid(),
        dp."id",
        CASE LOWER(day_name.value)
          WHEN 'sunday' THEN 0
          WHEN 'monday' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6
        END,
        (entry.value->>'startTime')::time,
        (entry.value->>'endTime')::time,
        now(),
        now()
      FROM "doctor_profiles" dp
      CROSS JOIN LATERAL jsonb_array_elements(dp."availability") AS entry(value)
      CROSS JOIN LATERAL jsonb_array_elements_text(entry.value->'days') AS day_name(value)
      WHERE dp."availability" IS NOT NULL
        AND jsonb_typeof(dp."availability") = 'array'
      ON CONFLICT ("doctor_profile_id", "day_of_week") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "doctor_recurring_availability"
      WHERE "doctor_profile_id" IN (
        SELECT "id" FROM "doctor_profiles" WHERE "availability" IS NOT NULL
      )
    `);
  }
}
