import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodGroup } from '../../../common/enums/blood-group.enum';

export class PatientProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

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
