import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BloodGroup } from '../../../common/enums/blood-group.enum';
import { Gender } from '../../../common/enums/gender.enum';

export class CreatePatientProfileDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: '1990-01-15', description: 'Used to derive patient age' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: Gender, example: Gender.Male })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ enum: BloodGroup, example: BloodGroup.OPositive })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ example: 'Penicillin' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  allergies?: string;

  @ApiPropertyOptional({ example: 'Hypertension' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  medicalHistory?: string;

  @ApiPropertyOptional({ example: 'Star Health' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  insuranceProvider?: string;

  @ApiPropertyOptional({ example: 'POL-123456' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  insurancePolicyNumber?: string;
}

export class UpdatePatientProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ enum: BloodGroup })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ example: 'Penicillin' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  allergies?: string;

  @ApiPropertyOptional({ example: 'Hypertension' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  medicalHistory?: string;

  @ApiPropertyOptional({ example: 'Star Health' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  insuranceProvider?: string;

  @ApiPropertyOptional({ example: 'POL-123456' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  insurancePolicyNumber?: string;
}

export class PatientProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ enum: BloodGroup })
  bloodGroup: BloodGroup | null;

  @ApiPropertyOptional()
  emergencyContactName: string | null;

  @ApiPropertyOptional()
  emergencyContactPhone: string | null;

  @ApiPropertyOptional()
  allergies: string | null;

  @ApiPropertyOptional()
  medicalHistory: string | null;

  @ApiPropertyOptional()
  insuranceProvider: string | null;

  @ApiPropertyOptional()
  insurancePolicyNumber: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
