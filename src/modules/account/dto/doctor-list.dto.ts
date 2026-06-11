import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DoctorAvailabilityStatus } from '../../../common/enums/doctor-availability-status.enum';
import { DoctorScheduleViewDto } from '../../appointments/dto/appointment-schedule.dto';
import { DoctorAvailabilityEntryDto } from './doctor-profile.dto';

export class ListDoctorsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
  @ApiPropertyOptional({
    description: 'Search doctors by first name, last name, or full name (partial match)',
    example: 'rahul',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by specialization (exact match, case-insensitive)',
    example: 'Cardiology',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Invalid specialization' })
  @MaxLength(150)
  @Matches(/^[\p{L}\d\s-]+$/u, { message: 'Invalid specialization' })
  specialization?: string;

  @ApiPropertyOptional({
    description: 'When true, return only doctors available at the current time',
    example: 'true',
  })
  @IsOptional()
  @IsIn(['true', 'false'], { message: 'availability must be true or false' })
  availability?: string;
}

export class DoctorListItemDto {
  @ApiProperty({ format: 'uuid', description: 'Doctor ID' })
  id: string;

  @ApiProperty({ example: 'Alice Smith', description: 'Full name' })
  fullName: string;

  @ApiProperty({ example: 'Cardiology' })
  specialization: string;

  @ApiProperty({ example: 12, description: 'Years of experience' })
  experience: number;

  @ApiProperty({ example: '500.00' })
  consultationFee: string;

  @ApiProperty({
    enum: DoctorAvailabilityStatus,
    example: DoctorAvailabilityStatus.Available,
    description: 'Whether the doctor is available right now',
  })
  availabilityStatus: DoctorAvailabilityStatus;
}

export class DoctorListResponseDto {
  @ApiProperty({ type: [DoctorListItemDto] })
  data: DoctorListItemDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class DoctorDetailResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Doctor ID' })
  id: string;

  @ApiProperty({ example: 'Alice Smith' })
  fullName: string;

  @ApiProperty({ example: 'Cardiology' })
  specialization: string;

  @ApiProperty({ example: 'MBBS, MD (Cardiology)' })
  qualification: string;

  @ApiProperty({ example: 12 })
  experience: number;

  @ApiPropertyOptional({ example: 'Board-certified cardiologist.' })
  bio: string | null;

  @ApiProperty({ example: '500.00' })
  consultationFee: string;

  @ApiProperty({
    enum: DoctorAvailabilityStatus,
    example: DoctorAvailabilityStatus.Available,
  })
  availabilityStatus: DoctorAvailabilityStatus;

  @ApiProperty({ type: [DoctorAvailabilityEntryDto] })
  availability: DoctorAvailabilityEntryDto[];

  @ApiPropertyOptional()
  schedule?: DoctorScheduleViewDto;
}
