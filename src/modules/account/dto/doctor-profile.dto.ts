import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class DoctorProfileSignupDto {
  @ApiProperty({ example: 'MED-12345' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  licenseNumber: string;

  @ApiProperty({ example: 'Cardiology' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  specialization: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ example: 'Board-certified cardiologist.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  consultationFee?: number;
}

export class DoctorProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  licenseNumber: string;

  @ApiProperty()
  specialization: string;

  @ApiPropertyOptional()
  yearsOfExperience: number | null;

  @ApiPropertyOptional()
  bio: string | null;

  @ApiPropertyOptional()
  consultationFee: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
