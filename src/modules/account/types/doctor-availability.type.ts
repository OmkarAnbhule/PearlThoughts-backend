import { WeekdayName } from '../../appointments/utils/schedule-resolution.util';

export interface DoctorAvailabilityEntry {
  day: WeekdayName;
  startTime: string;
  endTime: string;
}
