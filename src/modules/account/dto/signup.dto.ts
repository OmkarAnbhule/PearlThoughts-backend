import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PUBLIC_SIGNUP_USER_TYPES,
  UserType,
} from '../../../common/enums/user-type.enum';

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
}
