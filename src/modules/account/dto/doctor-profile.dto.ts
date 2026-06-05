import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DoctorAvailabilityEntry } from '../types/doctor-availability.type';

export class DoctorAvailabilityDto implements DoctorAvailabilityEntry {
  @ApiProperty({ example: 'Monday to Friday' })
  days: string;

  @ApiProperty({ example: '10:00 AM' })
  startTime: string;

  @ApiProperty({ example: '1:00 PM' })
  endTime: string;
}

export class DoctorProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ example: 'Dr. Lavangi' })
  displayName: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/doctors/lavangi.jpg' })
  profileImageUrl: string | null;

  @ApiPropertyOptional({ example: 'Gynecologist' })
  specialization: string | null;

  @ApiPropertyOptional({ example: 15 })
  yearsOfExperience: number | null;

  @ApiPropertyOptional({ example: 'Gold Medalist' })
  achievements: string | null;

  @ApiPropertyOptional({
    example: ['Pregnancy', 'New born', 'New mother'],
    type: [String],
  })
  services: string[] | null;

  @ApiPropertyOptional({ type: [DoctorAvailabilityDto] })
  availability: DoctorAvailabilityEntry[] | null;

  @ApiPropertyOptional()
  bio: string | null;

  @ApiPropertyOptional()
  licenseNumber: string | null;

  @ApiPropertyOptional()
  consultationFee: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
