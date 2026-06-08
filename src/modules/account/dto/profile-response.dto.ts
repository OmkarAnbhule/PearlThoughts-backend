import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../../../common/enums/gender.enum';
import { UserType } from '../../../common/enums/user-type.enum';
import { DoctorProfileResponseDto } from './doctor-profile.dto';
import { PatientProfileResponseDto } from './patient-profile.dto';

export class UserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserType })
  userType: UserType;

  @ApiPropertyOptional()
  firstName: string | null;

  @ApiPropertyOptional()
  lastName: string | null;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: UserSummaryDto })
  user: UserSummaryDto;
}

export class ProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserType })
  userType: UserType;

  @ApiPropertyOptional()
  firstName: string | null;

  @ApiPropertyOptional()
  lastName: string | null;

  @ApiPropertyOptional()
  phone: string | null;

  @ApiPropertyOptional()
  dateOfBirth: string | null;

  @ApiPropertyOptional({ description: 'Derived from dateOfBirth' })
  age: number | null;

  @ApiPropertyOptional({ enum: Gender })
  gender: Gender | null;

  @ApiPropertyOptional()
  addressLine1: string | null;

  @ApiPropertyOptional()
  addressLine2: string | null;

  @ApiPropertyOptional()
  city: string | null;

  @ApiPropertyOptional()
  state: string | null;

  @ApiPropertyOptional()
  postalCode: string | null;

  @ApiProperty()
  country: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: DoctorProfileResponseDto })
  doctorProfile?: DoctorProfileResponseDto;

  @ApiPropertyOptional({ type: PatientProfileResponseDto })
  patientProfile?: PatientProfileResponseDto;
}
