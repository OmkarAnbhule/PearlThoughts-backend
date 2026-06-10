export interface DoctorAvailabilityEntry {
  /** e.g. ["Monday", "Tuesday"] or weekday names */
  days: string[];
  /** e.g. "10:00 AM" */
  startTime: string;
  /** e.g. "1:00 PM" */
  endTime: string;
}
