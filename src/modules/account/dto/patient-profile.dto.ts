import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BloodGroup } from '../../../common/enums/blood-group.enum';

export class PatientProfileSignupDto {
  @ApiPropertyOptional({ enum: BloodGroup, example: BloodGroup.OPositive })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
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
