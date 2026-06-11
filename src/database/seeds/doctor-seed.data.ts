import {
  WEEKDAY_NAMES,
  WeekdayName,
} from '../../modules/appointments/utils/schedule-resolution.util';

export interface SeedDoctorAvailability {
  day: WeekdayName;
  startTime: string;
  endTime: string;
}

export interface SeedDoctor {
  email: string;
  firstName: string;
  lastName: string;
  specialization: string;
  qualification: string;
  yearsOfExperience: number;
  consultationFee: number;
  bio: string;
  availability: SeedDoctorAvailability[];
}

/** All days, all hours — keeps `?availability=true` useful for local/demo seed data. */
export const DEMO_ALL_DAY_AVAILABILITY: SeedDoctorAvailability[] =
  WEEKDAY_NAMES.map((day) => ({
    day,
    startTime: '00:00',
    endTime: '23:59',
  }));

export const SEED_DOCTORS: SeedDoctor[] = [
  {
    email: 'alice.smith@hospital-seed.local',
    firstName: 'Alice',
    lastName: 'Smith',
    specialization: 'Cardiology',
    qualification: 'MBBS, MD (Cardiology)',
    yearsOfExperience: 12,
    consultationFee: 750,
    bio: 'Board-certified cardiologist with expertise in preventive heart care.',
    availability: DEMO_ALL_DAY_AVAILABILITY,
  },
  {
    email: 'rahul.verma@hospital-seed.local',
    firstName: 'Rahul',
    lastName: 'Verma',
    specialization: 'Neurology',
    qualification: 'MBBS, DM (Neurology)',
    yearsOfExperience: 8,
    consultationFee: 600,
    bio: 'Specialist in stroke recovery and chronic neurological disorders.',
    availability: DEMO_ALL_DAY_AVAILABILITY,
  },
  {
    email: 'priya.sharma@hospital-seed.local',
    firstName: 'Priya',
    lastName: 'Sharma',
    specialization: 'Dermatology',
    qualification: 'MBBS, MD (Dermatology)',
    yearsOfExperience: 6,
    consultationFee: 500,
    bio: 'Focuses on clinical dermatology and cosmetic skin treatments.',
    availability: DEMO_ALL_DAY_AVAILABILITY,
  },
  {
    email: 'anil.kapoor@hospital-seed.local',
    firstName: 'Anil',
    lastName: 'Kapoor',
    specialization: 'Orthopedics',
    qualification: 'MBBS, MS (Orthopedics)',
    yearsOfExperience: 15,
    consultationFee: 800,
    bio: 'Experienced in joint replacement and sports injury rehabilitation.',
    availability: DEMO_ALL_DAY_AVAILABILITY,
  },
  {
    email: 'meera.joshi@hospital-seed.local',
    firstName: 'Meera',
    lastName: 'Joshi',
    specialization: 'Pediatrics',
    qualification: 'MBBS, DCH',
    yearsOfExperience: 10,
    consultationFee: 550,
    bio: 'Pediatrician with a focus on newborn and adolescent care.',
    availability: DEMO_ALL_DAY_AVAILABILITY,
  },
];
