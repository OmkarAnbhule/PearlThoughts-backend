import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DoctorAvailabilityEntry } from '../types/doctor-availability.type';

export class DoctorAvailabilityEntryDto implements DoctorAvailabilityEntry {
  @ApiProperty({ example: ['monday', 'wednesday', 'friday'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  days: string[];

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

export class CreateDoctorProfileDto {
  @ApiProperty({ example: 'Alice' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'Cardiology' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  specialization: string;

  @ApiProperty({ example: 'MBBS, MD (Cardiology)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  qualification: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsOfExperience: number;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  consultationFee: number;

  @ApiProperty({ type: [DoctorAvailabilityEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DoctorAvailabilityEntryDto)
  availability: DoctorAvailabilityEntryDto[];

  @ApiPropertyOptional({ example: 'Board-certified cardiologist with 10+ years experience.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;
}

export class UpdateDoctorProfileDto {
  @ApiPropertyOptional({ example: 'Alice' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Smith' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Cardiology' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  specialization?: string;

  @ApiPropertyOptional({ example: 'MBBS, MD (Cardiology)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  qualification?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  consultationFee?: number;

  @ApiPropertyOptional({ type: [DoctorAvailabilityEntryDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DoctorAvailabilityEntryDto)
  availability?: DoctorAvailabilityEntryDto[];

  @ApiPropertyOptional({ example: 'Updated profile details.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;
}

export class DoctorProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  specialization: string | null;

  @ApiPropertyOptional()
  qualification: string | null;

  @ApiPropertyOptional()
  yearsOfExperience: number | null;

  @ApiPropertyOptional()
  bio: string | null;

  @ApiPropertyOptional()
  consultationFee: string | null;

  @ApiPropertyOptional({ type: [DoctorAvailabilityEntryDto] })
  availability: DoctorAvailabilityEntry[] | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
