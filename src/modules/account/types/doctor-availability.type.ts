export interface DoctorAvailabilityEntry {
  /** e.g. "Monday to Friday" or "Saturday" */
  days: string;
  /** e.g. "10:00 AM" */
  startTime: string;
  /** e.g. "1:00 PM" */
  endTime: string;
}
