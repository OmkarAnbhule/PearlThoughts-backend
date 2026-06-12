import { DoctorAvailabilityStatus } from '../../../common/enums/doctor-availability-status.enum';
import { DoctorAvailabilityEntry } from '../types/doctor-availability.type';

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time.trim());
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
}

function entryMatchesDay(
  entry: DoctorAvailabilityEntry & { days?: string[] },
  currentDay: string,
): boolean {
  if ('day' in entry && entry.day) {
    return entry.day.toLowerCase() === currentDay;
  }

  return (
    entry.days?.some((day) => day.toLowerCase() === currentDay) ?? false
  );
}

export function getDoctorAvailabilityStatus(
  availability: DoctorAvailabilityEntry[] | null,
  now: Date = new Date(),
): DoctorAvailabilityStatus {
  if (!availability?.length) {
    return DoctorAvailabilityStatus.Unavailable;
  }

  const currentDay = DAY_NAMES[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const entry of availability) {
    if (!entryMatchesDay(entry, currentDay)) {
      continue;
    }

    const startMinutes = parseTimeToMinutes(entry.startTime);
    const endMinutes = parseTimeToMinutes(entry.endTime);

    if (startMinutes === null || endMinutes === null) {
      continue;
    }

    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return DoctorAvailabilityStatus.Available;
    }
  }

  return DoctorAvailabilityStatus.Unavailable;
}
