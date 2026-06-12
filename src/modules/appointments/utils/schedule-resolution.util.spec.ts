import {
  dayOfWeekFromName,
  generateBookableSlots,
  parseTimeToMinutes,
  resolveDayAvailability,
  timeRangesOverlap,
} from './schedule-resolution.util';

describe('schedule-resolution.util', () => {
  describe('timeRangesOverlap', () => {
    it('detects overlapping ranges', () => {
      expect(
        timeRangesOverlap({ start: 600, end: 720 }, { start: 660, end: 780 }),
      ).toBe(true);
    });

    it('allows adjacent non-overlapping ranges', () => {
      expect(
        timeRangesOverlap({ start: 600, end: 720 }, { start: 720, end: 840 }),
      ).toBe(false);
    });
  });

  describe('resolveDayAvailability', () => {
    const mondayRecurring = [
      { dayOfWeek: 1, startTime: '10:00', endTime: '12:00' },
      { dayOfWeek: 1, startTime: '14:00', endTime: '16:00' },
    ];

    it('uses all recurring windows for the weekday', () => {
      const resolved = resolveDayAvailability(
        mondayRecurring,
        [],
        new Date('2026-06-15T00:00:00'),
        new Date('2026-06-15T00:00:00'),
      );

      expect(resolved.status).toBe('available');
      expect(resolved.slots).toEqual([
        { startTime: '10:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '16:00' },
      ]);
    });

    it('prefers modified override over recurring availability', () => {
      const resolved = resolveDayAvailability(
        mondayRecurring,
        [
          {
            overrideType: 'modified',
            startTime: '11:00',
            endTime: '13:00',
            blockedStartTime: null,
            blockedEndTime: null,
            reason: null,
          },
        ],
        new Date('2026-06-15T00:00:00'),
        new Date('2026-06-15T00:00:00'),
      );

      expect(resolved.status).toBe('modified');
      expect(resolved.slots).toEqual([{ startTime: '11:00', endTime: '13:00' }]);
    });

    it('returns closed when a closed override exists', () => {
      const resolved = resolveDayAvailability(
        mondayRecurring,
        [
          {
            overrideType: 'closed',
            startTime: null,
            endTime: null,
            blockedStartTime: null,
            blockedEndTime: null,
            reason: 'Holiday',
          },
        ],
        new Date('2026-06-15T00:00:00'),
        new Date('2026-06-15T00:00:00'),
      );

      expect(resolved.status).toBe('closed');
      expect(resolved.slots).toEqual([]);
    });
  });

  describe('generateBookableSlots', () => {
    it('generates fixed-duration slots across multiple windows', () => {
      const resolved = resolveDayAvailability(
        [{ dayOfWeek: 1, startTime: '10:00', endTime: '11:00' }],
        [],
        new Date('2026-06-15T00:00:00'),
        new Date('2026-06-14T00:00:00'),
      );

      const slots = generateBookableSlots(resolved, 15);

      expect(slots).toEqual([
        { startTime: '10:00', endTime: '10:15' },
        { startTime: '10:15', endTime: '10:30' },
        { startTime: '10:30', endTime: '10:45' },
        { startTime: '10:45', endTime: '11:00' },
      ]);
    });

    it('skips past slots on the current day', () => {
      const resolved = resolveDayAvailability(
        [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }],
        [],
        new Date('2026-06-15T00:00:00'),
        new Date('2026-06-15T00:00:00'),
      );
      resolved.isToday = true;

      const slots = generateBookableSlots(
        resolved,
        30,
        new Date('2026-06-15T10:30:00'),
      );

      expect(slots.every((slot) => {
        const start = parseTimeToMinutes(slot.startTime);
        return start !== null && start > 10 * 60 + 30;
      })).toBe(true);
    });
  });

  describe('dayOfWeekFromName', () => {
    it('maps weekday names to JavaScript day indexes', () => {
      expect(dayOfWeekFromName('monday')).toBe(1);
      expect(dayOfWeekFromName('sunday')).toBe(0);
    });
  });
});
