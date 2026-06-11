import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, EntityManager, Repository } from 'typeorm';
import { AvailabilityOverrideType } from '../../common/enums/availability-override-type.enum';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { Appointment } from '../account/entities/appointment.entity';
import { DoctorAvailabilityOverride } from '../account/entities/doctor-availability-override.entity';
import { DoctorProfile } from '../account/entities/doctor-profile.entity';
import { DoctorRecurringAvailability } from '../account/entities/doctor-recurring-availability.entity';
import {
  CreateAvailabilityOverrideDto,
  DoctorScheduleViewDto,
  OverrideSummaryDto,
  RecurringAvailabilityEntryDto,
  ReplaceRecurringAvailabilityDto,
  ResolvedDayAvailabilityDto,
} from './dto/appointment-schedule.dto';
import {
  dayNameFromIndex,
  dayOfWeekFromName,
  formatDateKey,
  generateBookableSlots,
  getWeekDateRange,
  parseTimeToMinutes,
  recurringSlotsToLegacyAvailability,
  resolveDayAvailability,
  TimeRange,
} from './utils/schedule-resolution.util';

@Injectable()
export class DoctorScheduleService {
  constructor(
    @InjectRepository(DoctorProfile)
    private readonly doctorProfileRepository: Repository<DoctorProfile>,
    @InjectRepository(DoctorRecurringAvailability)
    private readonly recurringRepository: Repository<DoctorRecurringAvailability>,
    @InjectRepository(DoctorAvailabilityOverride)
    private readonly overrideRepository: Repository<DoctorAvailabilityOverride>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async replaceRecurringAvailability(
    userId: string,
    dto: ReplaceRecurringAvailabilityDto,
  ): Promise<RecurringAvailabilityEntryDto[]> {
    const profile = await this.findDoctorProfileByUserId(userId);
    this.validateRecurringEntries(dto.recurringSchedule);

    await this.recurringRepository.manager.transaction(async (manager) => {
      await this.syncRecurringAvailability(
        profile.id,
        dto.recurringSchedule,
        manager,
      );
    });

    return this.getRecurringSchedule(profile.id);
  }

  async syncRecurringAvailability(
    doctorProfileId: string,
    entries: RecurringAvailabilityEntryDto[],
    manager: EntityManager,
  ): Promise<void> {
    const recurringRepo = manager.getRepository(DoctorRecurringAvailability);
    const profileRepo = manager.getRepository(DoctorProfile);

    await recurringRepo.delete({ doctorProfileId });

    const rows = entries.map((entry) => {
      const dayOfWeek = dayOfWeekFromName(entry.day);
      if (dayOfWeek === null) {
        throw new BadRequestException(`Invalid day: ${entry.day}`);
      }

      return recurringRepo.create({
        doctorProfileId,
        dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
      });
    });

    await recurringRepo.save(rows);

    const legacyAvailability = recurringSlotsToLegacyAvailability(
      rows.map((row) => ({
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
      })),
    );

    await profileRepo.update(doctorProfileId, {
      availability: legacyAvailability,
    });
  }

  async getRecurringSchedule(
    doctorProfileId: string,
  ): Promise<RecurringAvailabilityEntryDto[]> {
    const rows = await this.recurringRepository.find({
      where: { doctorProfileId },
      order: { dayOfWeek: 'ASC' },
    });

    return rows.map((row) => ({
      day: dayNameFromIndex(row.dayOfWeek),
      startTime: row.startTime.slice(0, 5),
      endTime: row.endTime.slice(0, 5),
    }));
  }

  async createOverride(
    userId: string,
    dto: CreateAvailabilityOverrideDto,
  ): Promise<OverrideSummaryDto> {
    const profile = await this.findDoctorProfileByUserId(userId);
    this.validateOverrideDto(dto);

    if (
      dto.overrideType === AvailabilityOverrideType.Closed ||
      dto.overrideType === AvailabilityOverrideType.Modified
    ) {
      await this.overrideRepository.delete({
        doctorProfileId: profile.id,
        overrideDate: dto.overrideDate,
        overrideType:
          dto.overrideType === AvailabilityOverrideType.Closed
            ? AvailabilityOverrideType.Closed
            : AvailabilityOverrideType.Modified,
      });
    }

    const saved = await this.overrideRepository.save(
      this.overrideRepository.create({
        doctorProfileId: profile.id,
        overrideDate: dto.overrideDate,
        overrideType: dto.overrideType,
        startTime: dto.startTime ?? null,
        endTime: dto.endTime ?? null,
        blockedStartTime: dto.blockedStartTime ?? null,
        blockedEndTime: dto.blockedEndTime ?? null,
        reason: dto.reason ?? null,
      }),
    );

    return this.toOverrideSummary(saved);
  }

  async listOverrides(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<OverrideSummaryDto[]> {
    const profile = await this.findDoctorProfileByUserId(userId);
    const range = this.resolveDateRange(from, to);

    const overrides = await this.overrideRepository.find({
      where: {
        doctorProfileId: profile.id,
        overrideDate: Between(range.from, range.to),
      },
      order: { overrideDate: 'ASC', createdAt: 'ASC' },
    });

    return overrides.map((override) => this.toOverrideSummary(override));
  }

  async deleteOverride(userId: string, overrideId: string): Promise<void> {
    const profile = await this.findDoctorProfileByUserId(userId);
    const override = await this.overrideRepository.findOne({
      where: { id: overrideId, doctorProfileId: profile.id },
    });

    if (!override) {
      throw new NotFoundException('Availability override not found');
    }

    await this.overrideRepository.delete(override.id);
  }

  async getResolvedScheduleForDoctor(
    doctorProfileId: string,
    from?: string,
    to?: string,
  ): Promise<DoctorScheduleViewDto> {
    const profile = await this.doctorProfileRepository.findOne({
      where: { id: doctorProfileId },
    });

    if (!profile) {
      throw new NotFoundException('Doctor not found');
    }

    const recurring = await this.loadRecurringSlots(doctorProfileId);
    const range = this.resolveDateRange(from, to);
    const overridesByDate = await this.loadOverridesByDate(
      doctorProfileId,
      range.from,
      range.to,
    );

    const thisWeekDates = getWeekDateRange(new Date());
    const thisWeek = thisWeekDates.map((date) =>
      this.toResolvedDayDto(
        resolveDayAvailability(
          recurring,
          overridesByDate.get(formatDateKey(date)) ?? [],
          date,
        ),
      ),
    );

    const overrideEntities = await this.overrideRepository.find({
      where: {
        doctorProfileId,
        overrideDate: Between(range.from, range.to),
      },
      order: { overrideDate: 'ASC' },
    });

    return {
      thisWeek,
      recurringSchedule: await this.getRecurringSchedule(doctorProfileId),
      upcomingOverrides: overrideEntities.map((override) =>
        this.toOverrideSummary(override),
      ),
    };
  }

  async getBookableSlots(
    doctorProfileId: string,
    date: string,
  ): Promise<TimeRange[]> {
    const recurring = await this.loadRecurringSlots(doctorProfileId);
    const overrides = await this.loadOverridesForDate(doctorProfileId, date);
    const targetDate = new Date(`${date}T00:00:00`);
    const resolved = resolveDayAvailability(recurring, overrides, targetDate);
    const slots = generateBookableSlots(resolved);

    return this.removeBookedSlots(doctorProfileId, date, slots);
  }

  async loadRecurringSlots(
    doctorProfileId: string,
  ): Promise<Array<{ dayOfWeek: number; startTime: string; endTime: string }>> {
    const rows = await this.recurringRepository.find({
      where: { doctorProfileId },
    });

    return rows.map((row) => ({
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
    }));
  }

  async loadOverridesForDate(
    doctorProfileId: string,
    date: string,
  ): Promise<
    Array<{
      overrideType: 'closed' | 'modified' | 'blocked';
      startTime: string | null;
      endTime: string | null;
      blockedStartTime: string | null;
      blockedEndTime: string | null;
      reason: string | null;
    }>
  > {
    const overrides = await this.overrideRepository.find({
      where: { doctorProfileId, overrideDate: date },
    });

    return overrides.map((override) => ({
      overrideType: override.overrideType,
      startTime: override.startTime,
      endTime: override.endTime,
      blockedStartTime: override.blockedStartTime,
      blockedEndTime: override.blockedEndTime,
      reason: override.reason,
    }));
  }

  async loadOverridesForToday(
    doctorProfileIds: string[],
    date: string,
  ): Promise<Map<string, Awaited<ReturnType<DoctorScheduleService['loadOverridesForDate']>>>> {
    if (doctorProfileIds.length === 0) {
      return new Map();
    }

    const overrides = await this.overrideRepository
      .createQueryBuilder('override')
      .where('override.doctor_profile_id IN (:...doctorProfileIds)', {
        doctorProfileIds,
      })
      .andWhere('override.override_date = :date', { date })
      .getMany();

    const grouped = new Map<
      string,
      Awaited<ReturnType<DoctorScheduleService['loadOverridesForDate']>>
    >();

    for (const override of overrides) {
      const existing = grouped.get(override.doctorProfileId) ?? [];
      existing.push({
        overrideType: override.overrideType,
        startTime: override.startTime,
        endTime: override.endTime,
        blockedStartTime: override.blockedStartTime,
        blockedEndTime: override.blockedEndTime,
        reason: override.reason,
      });
      grouped.set(override.doctorProfileId, existing);
    }

    return grouped;
  }

  private async removeBookedSlots(
    doctorProfileId: string,
    date: string,
    slots: TimeRange[],
  ): Promise<TimeRange[]> {
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    const appointments = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.doctor_profile_id = :doctorProfileId', {
        doctorProfileId,
      })
      .andWhere('appointment.scheduled_start >= :dayStart', { dayStart })
      .andWhere('appointment.scheduled_start <= :dayEnd', { dayEnd })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: [AppointmentStatus.Pending, AppointmentStatus.Confirmed],
      })
      .getMany();

    return slots.filter((slot) => {
      const slotDate = new Date(`${date}T${slot.startTime}:00`);

      return !appointments.some(
        (appointment) =>
          appointment.scheduledStart.getTime() === slotDate.getTime(),
      );
    });
  }

  private async loadOverridesByDate(
    doctorProfileId: string,
    from: string,
    to: string,
  ): Promise<
    Map<
      string,
      Awaited<ReturnType<DoctorScheduleService['loadOverridesForDate']>>
    >
  > {
    const overrides = await this.overrideRepository.find({
      where: {
        doctorProfileId,
        overrideDate: Between(from, to),
      },
    });

    const grouped = new Map<
      string,
      Awaited<ReturnType<DoctorScheduleService['loadOverridesForDate']>>
    >();

    for (const override of overrides) {
      const existing = grouped.get(override.overrideDate) ?? [];
      existing.push({
        overrideType: override.overrideType,
        startTime: override.startTime,
        endTime: override.endTime,
        blockedStartTime: override.blockedStartTime,
        blockedEndTime: override.blockedEndTime,
        reason: override.reason,
      });
      grouped.set(override.overrideDate, existing);
    }

    return grouped;
  }

  private resolveDateRange(
    from?: string,
    to?: string,
  ): { from: string; to: string } {
    const weekDates = getWeekDateRange(new Date());
    return {
      from: from ?? formatDateKey(weekDates[0]),
      to: to ?? formatDateKey(weekDates[6]),
    };
  }

  private enumerateDates(from: string, to: string): Date[] {
    const dates: Date[] = [];
    const current = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private toResolvedDayDto(
    resolved: ReturnType<typeof resolveDayAvailability>,
  ): ResolvedDayAvailabilityDto {
    return {
      date: resolved.date,
      day: resolved.day,
      status: resolved.status,
      slots: resolved.slots,
      overrides: resolved.overrides.map((override, index) => ({
        id: `resolved-${resolved.date}-${index}`,
        overrideDate: resolved.date,
        overrideType: override.overrideType as AvailabilityOverrideType,
        startTime: override.startTime,
        endTime: override.endTime,
        blockedStartTime: override.blockedStartTime,
        blockedEndTime: override.blockedEndTime,
        reason: override.reason,
      })),
      isToday: resolved.isToday,
    };
  }

  private toOverrideSummary(
    override: DoctorAvailabilityOverride,
  ): OverrideSummaryDto {
    return {
      id: override.id,
      overrideDate: override.overrideDate,
      overrideType: override.overrideType,
      startTime: override.startTime,
      endTime: override.endTime,
      blockedStartTime: override.blockedStartTime,
      blockedEndTime: override.blockedEndTime,
      reason: override.reason,
    };
  }

  private validateRecurringEntries(
    entries: RecurringAvailabilityEntryDto[],
  ): void {
    const seenDays = new Set<string>();

    for (const entry of entries) {
      if (seenDays.has(entry.day)) {
        throw new BadRequestException(`Duplicate day in schedule: ${entry.day}`);
      }

      seenDays.add(entry.day);

      const start = parseTimeToMinutes(entry.startTime);
      const end = parseTimeToMinutes(entry.endTime);

      if (start === null || end === null || start >= end) {
        throw new BadRequestException(
          `Invalid time range for ${entry.day}`,
        );
      }
    }
  }

  private validateOverrideDto(dto: CreateAvailabilityOverrideDto): void {
    if (dto.overrideType === AvailabilityOverrideType.Modified) {
      const start = parseTimeToMinutes(dto.startTime ?? '');
      const end = parseTimeToMinutes(dto.endTime ?? '');

      if (start === null || end === null || start >= end) {
        throw new BadRequestException('Modified override requires a valid time range');
      }
    }

    if (dto.overrideType === AvailabilityOverrideType.Blocked) {
      const start = parseTimeToMinutes(dto.blockedStartTime ?? '');
      const end = parseTimeToMinutes(dto.blockedEndTime ?? '');

      if (start === null || end === null || start >= end) {
        throw new BadRequestException('Blocked override requires a valid blocked time range');
      }
    }
  }

  private async findDoctorProfileByUserId(userId: string): Promise<DoctorProfile> {
    const profile = await this.doctorProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    return profile;
  }
}
