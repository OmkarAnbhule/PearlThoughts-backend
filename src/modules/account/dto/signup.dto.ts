import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Gender } from '../../../common/enums/gender.enum';
import {
  PUBLIC_SIGNUP_USER_TYPES,
  UserType,
} from '../../../common/enums/user-type.enum';
import { DoctorProfileSignupDto } from './doctor-profile.dto';
import { PatientProfileSignupDto } from './patient-profile.dto';

export class SignupDto {
  @ApiProperty({ example: 'patient@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword1', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ enum: PUBLIC_SIGNUP_USER_TYPES, example: UserType.Patient })
  @IsIn(PUBLIC_SIGNUP_USER_TYPES)
  userType: UserType;

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

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: '400001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'IN', default: 'IN' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({ type: DoctorProfileSignupDto })
  @ValidateIf((dto: SignupDto) => dto.userType === UserType.Doctor)
  @ValidateNested()
  @Type(() => DoctorProfileSignupDto)
  @IsNotEmpty()
  doctorProfile?: DoctorProfileSignupDto;

  @ApiPropertyOptional({ type: PatientProfileSignupDto })
  @ValidateIf((dto: SignupDto) => dto.userType === UserType.Patient)
  @ValidateNested()
  @Type(() => PatientProfileSignupDto)
  @IsNotEmpty()
  patientProfile?: PatientProfileSignupDto;
}
