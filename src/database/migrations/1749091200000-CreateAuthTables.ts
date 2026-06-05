import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1749091200000 implements MigrationInterface {
  name = 'CreateAuthTables1749091200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."users_user_type_enum" AS ENUM(
        'patient', 'doctor', 'staff', 'admin'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."users_gender_enum" AS ENUM(
        'male', 'female', 'other', 'prefer_not_to_say'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."patient_profiles_blood_group_enum" AS ENUM(
        'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "user_type" "public"."users_user_type_enum" NOT NULL,
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "phone" character varying,
        "date_of_birth" date,
        "gender" "public"."users_gender_enum",
        "address_line1" character varying,
        "address_line2" character varying,
        "city" character varying,
        "state" character varying,
        "postal_code" character varying,
        "country" character varying NOT NULL DEFAULT 'IN',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "doctor_profiles" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "license_number" character varying NOT NULL,
        "specialization" character varying NOT NULL,
        "years_of_experience" integer,
        "bio" text,
        "consultation_fee" numeric(10,2),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doctor_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_doctor_profiles_user_id" UNIQUE ("user_id"),
        CONSTRAINT "UQ_doctor_profiles_license_number" UNIQUE ("license_number"),
        CONSTRAINT "FK_doctor_profiles_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "patient_profiles" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "blood_group" "public"."patient_profiles_blood_group_enum",
        "emergency_contact_name" character varying,
        "emergency_contact_phone" character varying,
        "allergies" text,
        "medical_history" text,
        "insurance_provider" character varying,
        "insurance_policy_number" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_patient_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_patient_profiles_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_patient_profiles_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "patient_profiles"`);
    await queryRunner.query(`DROP TABLE "doctor_profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."patient_profiles_blood_group_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_user_type_enum"`);
  }
}
