export const WEEKDAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export type WeekdayName = (typeof WEEKDAY_NAMES)[number];

export interface TimeRange {
  startTime: string;
  endTime: string;
}

export interface DoctorRecurringSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface DoctorOverrideSlot {
  overrideType: 'closed' | 'modified' | 'blocked';
  startTime: string | null;
  endTime: string | null;
  blockedStartTime: string | null;
  blockedEndTime: string | null;
  reason: string | null;
}

export type ResolvedDayStatus =
  | 'available'
  | 'closed'
  | 'modified'
  | 'partially_blocked'
  | 'unavailable';

export interface ResolvedDayAvailability {
  date: string;
  day: WeekdayName;
  status: ResolvedDayStatus;
  slots: TimeRange[];
  overrides: DoctorOverrideSlot[];
  isToday: boolean;
}

export const DEFAULT_SLOT_DURATION_MINUTES = 30;

export function normalizeTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) {
    return value;
  }

  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time.trim());
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function dayOfWeekFromName(name: string): number | null {
  const index = WEEKDAY_NAMES.indexOf(name.toLowerCase() as WeekdayName);
  return index === -1 ? null : index;
}

export function dayNameFromIndex(dayOfWeek: number): WeekdayName {
  return WEEKDAY_NAMES[dayOfWeek] ?? 'sunday';
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekDateRange(referenceDate: Date = new Date()): Date[] {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  return Array.from({ length: 7 }, (_, index) => {
    const weekDate = new Date(monday);
    weekDate.setDate(monday.getDate() + index);
    return weekDate;
  });
}

function subtractBlockedRanges(
  baseStart: number,
  baseEnd: number,
  blocks: Array<{ start: number; end: number }>,
): TimeRange[] {
  let ranges: Array<{ start: number; end: number }> = [
    { start: baseStart, end: baseEnd },
  ];

  for (const block of blocks.sort((a, b) => a.start - b.start)) {
    const nextRanges: Array<{ start: number; end: number }> = [];

    for (const range of ranges) {
      if (block.end <= range.start || block.start >= range.end) {
        nextRanges.push(range);
        continue;
      }

      if (block.start > range.start) {
        nextRanges.push({ start: range.start, end: block.start });
      }

      if (block.end < range.end) {
        nextRanges.push({ start: block.end, end: range.end });
      }
    }

    ranges = nextRanges.filter((range) => range.end > range.start);
  }

  return ranges.map((range) => ({
    startTime: minutesToTime(range.start),
    endTime: minutesToTime(range.end),
  }));
}

export function resolveDayAvailability(
  recurring: DoctorRecurringSlot[],
  overrides: DoctorOverrideSlot[],
  date: Date,
  today: Date = new Date(),
): ResolvedDayAvailability {
  const dateKey = formatDateKey(date);
  const day = dayNameFromIndex(date.getDay());
  const isToday = formatDateKey(today) === dateKey;

  const closedOverride = overrides.find(
    (override) => override.overrideType === 'closed',
  );
  if (closedOverride) {
    return {
      date: dateKey,
      day,
      status: 'closed',
      slots: [],
      overrides,
      isToday,
    };
  }

  const modifiedOverride = overrides.find(
    (override) => override.overrideType === 'modified',
  );

  let baseStart: number | null = null;
  let baseEnd: number | null = null;
  let status: ResolvedDayStatus = 'unavailable';

  if (modifiedOverride?.startTime && modifiedOverride.endTime) {
    baseStart = parseTimeToMinutes(modifiedOverride.startTime);
    baseEnd = parseTimeToMinutes(modifiedOverride.endTime);
    status = 'modified';
  } else {
    const recurringSlot = recurring.find(
      (slot) => slot.dayOfWeek === date.getDay(),
    );

    if (recurringSlot) {
      baseStart = parseTimeToMinutes(recurringSlot.startTime);
      baseEnd = parseTimeToMinutes(recurringSlot.endTime);
      status = 'available';
    }
  }

  if (
    baseStart === null ||
    baseEnd === null ||
    baseStart >= baseEnd
  ) {
    return {
      date: dateKey,
      day,
      status: 'unavailable',
      slots: [],
      overrides,
      isToday,
    };
  }

  const blockedRanges = overrides
    .filter((override) => override.overrideType === 'blocked')
    .map((override) => ({
      start: parseTimeToMinutes(override.blockedStartTime ?? '') ?? -1,
      end: parseTimeToMinutes(override.blockedEndTime ?? '') ?? -1,
    }))
    .filter((range) => range.start >= 0 && range.end > range.start);

  const slots = subtractBlockedRanges(baseStart, baseEnd, blockedRanges);

  if (blockedRanges.length > 0 && slots.length > 0 && status === 'available') {
    status = 'partially_blocked';
  }

  if (slots.length === 0 && status !== 'modified') {
    status = blockedRanges.length > 0 ? 'closed' : 'unavailable';
  }

  return {
    date: dateKey,
    day,
    status,
    slots,
    overrides,
    isToday,
  };
}

export function generateBookableSlots(
  resolvedDay: ResolvedDayAvailability,
  slotDurationMinutes: number = DEFAULT_SLOT_DURATION_MINUTES,
  now: Date = new Date(),
): TimeRange[] {
  const bookableSlots: TimeRange[] = [];

  for (const range of resolvedDay.slots) {
    const rangeStart = parseTimeToMinutes(range.startTime);
    const rangeEnd = parseTimeToMinutes(range.endTime);

    if (rangeStart === null || rangeEnd === null) {
      continue;
    }

    for (
      let start = rangeStart;
      start + slotDurationMinutes <= rangeEnd;
      start += slotDurationMinutes
    ) {
      const end = start + slotDurationMinutes;
      const slotStart = minutesToTime(start);
      const slotEnd = minutesToTime(end);

      if (resolvedDay.isToday) {
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        if (start <= nowMinutes) {
          continue;
        }
      }

      bookableSlots.push({ startTime: slotStart, endTime: slotEnd });
    }
  }

  return bookableSlots;
}

export function isCurrentlyAvailable(
  recurring: DoctorRecurringSlot[],
  overrides: DoctorOverrideSlot[],
  now: Date = new Date(),
): boolean {
  const resolved = resolveDayAvailability(recurring, overrides, now, now);
  if (resolved.slots.length === 0) {
    return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return resolved.slots.some((slot) => {
    const start = parseTimeToMinutes(slot.startTime);
    const end = parseTimeToMinutes(slot.endTime);
    return (
      start !== null &&
      end !== null &&
      currentMinutes >= start &&
      currentMinutes < end
    );
  });
}

export function recurringSlotsToLegacyAvailability(
  recurring: DoctorRecurringSlot[],
): Array<{ days: string[]; startTime: string; endTime: string }> {
  const grouped = new Map<string, { days: string[]; startTime: string; endTime: string }>();

  for (const slot of recurring) {
    const key = `${normalizeTime(slot.startTime)}-${normalizeTime(slot.endTime)}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.days.push(dayNameFromIndex(slot.dayOfWeek));
      continue;
    }

    grouped.set(key, {
      days: [dayNameFromIndex(slot.dayOfWeek)],
      startTime: normalizeTime(slot.startTime),
      endTime: normalizeTime(slot.endTime),
    });
  }

  return [...grouped.values()];
}
