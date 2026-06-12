import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { AvailabilityOverrideType } from '../../../common/enums/availability-override-type.enum';
import type { AllowedSlotDurationMinutes } from '../utils/schedule-resolution.util';
import {
  ALLOWED_SLOT_DURATIONS_MINUTES,
  DEFAULT_SLOT_DURATION_MINUTES,
  WEEKDAY_NAMES,
} from '../utils/schedule-resolution.util';

export class RecurringAvailabilityEntryDto {
  @ApiProperty({ example: 'monday', enum: WEEKDAY_NAMES })
  @IsIn([...WEEKDAY_NAMES])
  day: (typeof WEEKDAY_NAMES)[number];

  @ApiProperty({ example: '09:00' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  endTime: string;
}

export class RecurringAvailabilityResponseDto extends RecurringAvailabilityEntryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
}

export class UpdateRecurringAvailabilityDto {
  @ApiPropertyOptional({ example: 'monday', enum: WEEKDAY_NAMES })
  @IsOptional()
  @IsIn([...WEEKDAY_NAMES])
  day?: (typeof WEEKDAY_NAMES)[number];

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  startTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  endTime?: string;
}

export class ReplaceRecurringAvailabilityDto {
  @ApiProperty({ type: [RecurringAvailabilityEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecurringAvailabilityEntryDto)
  recurringSchedule: RecurringAvailabilityEntryDto[];
}

export class CreateAvailabilityOverrideDto {
  @ApiProperty({ example: '2026-06-12' })
  @IsDateString()
  overrideDate: string;

  @ApiProperty({ enum: AvailabilityOverrideType })
  @IsEnum(AvailabilityOverrideType)
  overrideType: AvailabilityOverrideType;

  @ApiPropertyOptional({ example: '14:00' })
  @ValidateIf((dto) => dto.overrideType === AvailabilityOverrideType.Modified)
  @IsString()
  @IsNotEmpty()
  startTime?: string;

  @ApiPropertyOptional({ example: '18:00' })
  @ValidateIf((dto) => dto.overrideType === AvailabilityOverrideType.Modified)
  @IsString()
  @IsNotEmpty()
  endTime?: string;

  @ApiPropertyOptional({ example: '10:00' })
  @ValidateIf((dto) => dto.overrideType === AvailabilityOverrideType.Blocked)
  @IsString()
  @IsNotEmpty()
  blockedStartTime?: string;

  @ApiPropertyOptional({ example: '14:00' })
  @ValidateIf((dto) => dto.overrideType === AvailabilityOverrideType.Blocked)
  @IsString()
  @IsNotEmpty()
  blockedEndTime?: string;

  @ApiPropertyOptional({ example: 'Emergency surgery' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class OverrideSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: '2026-06-12' })
  overrideDate: string;

  @ApiProperty({ enum: AvailabilityOverrideType })
  overrideType: AvailabilityOverrideType;

  @ApiPropertyOptional()
  startTime: string | null;

  @ApiPropertyOptional()
  endTime: string | null;

  @ApiPropertyOptional()
  blockedStartTime: string | null;

  @ApiPropertyOptional()
  blockedEndTime: string | null;

  @ApiPropertyOptional()
  reason: string | null;
}

export class BookableSlotDto {
  @ApiProperty({ example: '09:00' })
  startTime: string;

  @ApiProperty({ example: '09:30' })
  endTime: string;
}

export class DoctorSlotsResponseDto {
  @ApiProperty({ example: '2026-06-20' })
  date: string;

  @ApiProperty({ example: DEFAULT_SLOT_DURATION_MINUTES })
  durationMinutes: number;

  @ApiProperty({
    example: 'available',
    enum: ['available', 'closed', 'modified', 'partially_blocked', 'unavailable'],
  })
  availabilityStatus: string;

  @ApiProperty({ type: [BookableSlotDto] })
  slots: BookableSlotDto[];

  @ApiPropertyOptional({
    example: 'No bookable slots remain for this date',
  })
  message?: string;
}

export class ResolvedDayAvailabilityDto {
  @ApiProperty({ example: '2026-06-09' })
  date: string;

  @ApiProperty({ example: 'monday' })
  day: string;

  @ApiProperty({
    example: 'available',
    enum: ['available', 'closed', 'modified', 'partially_blocked', 'unavailable'],
  })
  status: string;

  @ApiProperty({ type: [BookableSlotDto] })
  slots: BookableSlotDto[];

  @ApiProperty({ type: [OverrideSummaryDto] })
  overrides: OverrideSummaryDto[];

  @ApiProperty()
  isToday: boolean;
}

export class DoctorScheduleViewDto {
  @ApiProperty({ type: [ResolvedDayAvailabilityDto] })
  thisWeek: ResolvedDayAvailabilityDto[];

  @ApiProperty({ type: [RecurringAvailabilityResponseDto] })
  recurringSchedule: RecurringAvailabilityResponseDto[];

  @ApiProperty({ type: [OverrideSummaryDto] })
  upcomingOverrides: OverrideSummaryDto[];
}

export class ScheduleQueryDto {
  @ApiPropertyOptional({ example: '2026-06-09' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class AvailabilityDateQueryDto {
  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  date: string;
}

export class SlotsQueryDto {
  @ApiProperty({ example: '2026-06-10' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    example: DEFAULT_SLOT_DURATION_MINUTES,
    enum: ALLOWED_SLOT_DURATIONS_MINUTES,
  })
  @IsOptional()
  @IsIn([...ALLOWED_SLOT_DURATIONS_MINUTES])
  @Type(() => Number)
  duration?: AllowedSlotDurationMinutes;
}

export class CreateAppointmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  doctorId: string;

  @ApiProperty({ example: '2026-06-10' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiPropertyOptional({
    example: DEFAULT_SLOT_DURATION_MINUTES,
    enum: ALLOWED_SLOT_DURATIONS_MINUTES,
  })
  @IsOptional()
  @IsIn([...ALLOWED_SLOT_DURATIONS_MINUTES])
  @Type(() => Number)
  duration?: AllowedSlotDurationMinutes;

  @ApiPropertyOptional({ example: 'Follow-up consultation' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CancelAppointmentDto {
  @ApiPropertyOptional({ example: 'Unable to attend' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;
}

export class AppointmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  doctorId: string;

  @ApiProperty()
  doctorName: string;

  @ApiProperty()
  patientUserId: string;

  @ApiProperty()
  scheduledStart: Date;

  @ApiProperty()
  scheduledEnd: Date;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  notes: string | null;
}
