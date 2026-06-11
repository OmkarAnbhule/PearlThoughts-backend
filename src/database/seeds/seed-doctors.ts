import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import dataSource from '../data-source';
import { UserType } from '../../common/enums/user-type.enum';
import { DoctorProfile } from '../../modules/account/entities/doctor-profile.entity';
import { DoctorRecurringAvailability } from '../../modules/account/entities/doctor-recurring-availability.entity';
import { User } from '../../modules/account/entities/user.entity';
import {
  dayOfWeekFromName,
  recurringSlotsToLegacyAvailability,
} from '../../modules/appointments/utils/schedule-resolution.util';
import { SEED_DOCTORS } from './doctor-seed.data';

config();

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'Doctor@123';
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

async function hasRecurringAvailabilityTable(): Promise<boolean> {
  const result = await dataSource.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'doctor_recurring_availability'
    ) AS "exists"
  `);

  return Boolean(result[0]?.exists);
}

function buildRecurringRows(
  seed: (typeof SEED_DOCTORS)[number],
): Array<{ dayOfWeek: number; startTime: string; endTime: string }> {
  return seed.availability.map((slot) => {
    const dayOfWeek = dayOfWeekFromName(slot.day);
    if (dayOfWeek === null) {
      throw new Error(`Invalid day in seed data: ${slot.day}`);
    }

    return {
      dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
    };
  });
}

async function upsertDoctorAvailability(
  profileId: string,
  recurringRows: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
  recurringTableExists: boolean,
): Promise<void> {
  const legacyAvailability = recurringSlotsToLegacyAvailability(recurringRows);

  await dataSource.getRepository(DoctorProfile).update(profileId, {
    availability: legacyAvailability,
  });

  if (!recurringTableExists) {
    return;
  }

  const recurringRepo = dataSource.getRepository(DoctorRecurringAvailability);
  await recurringRepo.delete({ doctorProfileId: profileId });
  await recurringRepo.save(
    recurringRows.map((row) =>
      recurringRepo.create({
        id: randomUUID(),
        doctorProfileId: profileId,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
      }),
    ),
  );
}

async function seedDoctors(): Promise<void> {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const doctorRepo = dataSource.getRepository(DoctorProfile);
  const recurringTableExists = await hasRecurringAvailabilityTable();
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  let created = 0;
  let updated = 0;

  for (const seed of SEED_DOCTORS) {
    const email = seed.email.toLowerCase();
    const recurringRows = buildRecurringRows(seed);
    const existingUser = await userRepo.findOne({
      where: { email },
      relations: { doctorProfile: true },
    });

    if (existingUser?.doctorProfile) {
      await upsertDoctorAvailability(
        existingUser.doctorProfile.id,
        recurringRows,
        recurringTableExists,
      );
      console.log(`updated ${email}`);
      updated += 1;
      continue;
    }

    await dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(User).save(
        manager.getRepository(User).create({
          id: randomUUID(),
          email,
          passwordHash,
          userType: UserType.Doctor,
          firstName: seed.firstName,
          lastName: seed.lastName,
          country: 'IN',
          isActive: true,
        }),
      );

      const legacyAvailability =
        recurringSlotsToLegacyAvailability(recurringRows);

      const profile = await manager.getRepository(DoctorProfile).save(
        manager.getRepository(DoctorProfile).create({
          id: randomUUID(),
          userId: user.id,
          specialization: seed.specialization,
          qualification: seed.qualification,
          yearsOfExperience: seed.yearsOfExperience,
          consultationFee: seed.consultationFee.toFixed(2),
          bio: seed.bio,
          availability: legacyAvailability,
        }),
      );

      if (recurringTableExists) {
        await manager.getRepository(DoctorRecurringAvailability).save(
          recurringRows.map((row) =>
            manager.getRepository(DoctorRecurringAvailability).create({
              id: randomUUID(),
              doctorProfileId: profile.id,
              dayOfWeek: row.dayOfWeek,
              startTime: row.startTime,
              endTime: row.endTime,
            }),
          ),
        );
      }
    });

    console.log(`added ${email}`);
    created += 1;
  }

  const onboardedCount = await doctorRepo
    .createQueryBuilder('doctor')
    .innerJoin('doctor.user', 'user')
    .where('user.userType = :userType', { userType: UserType.Doctor })
    .andWhere('doctor.availability IS NOT NULL')
    .getCount();

  console.log(
    `\nDoctor seed complete: ${created} created, ${updated} updated.`,
  );
  console.log(`Onboarded doctors in DB: ${onboardedCount}`);
  console.log(`Default password for new accounts: ${DEFAULT_PASSWORD}`);
}

seedDoctors()
  .catch((error: unknown) => {
    console.error('Doctor seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });
