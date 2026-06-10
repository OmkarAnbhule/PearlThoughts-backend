import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserType } from '../../common/enums/user-type.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AccountService } from './account.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import {
  CreateDoctorProfileDto,
  UpdateDoctorProfileDto,
} from './dto/doctor-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { User } from './entities/user.entity';

@ApiTags('Doctor')
@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.Doctor)
@ApiBearerAuth('access-token')
export class DoctorController {
  constructor(private readonly accountService: AccountService) {}

  @Post('profile')
  @ApiOperation({ summary: 'Create doctor profile (onboarding)' })
  @ApiCreatedResponse({ type: ProfileResponseDto })
  @ApiForbiddenResponse({ description: 'Doctor role required' })
  createProfile(
    @CurrentUser() user: User,
    @Body() dto: CreateDoctorProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.accountService.createDoctorProfile(user.id, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get the authenticated doctor profile' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Doctor role required' })
  getProfile(@CurrentUser() user: User): Promise<ProfileResponseDto> {
    return this.accountService.getProfile(user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update doctor profile fields' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiForbiddenResponse({ description: 'Doctor role required' })
  updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateDoctorProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.accountService.updateDoctorProfile(user.id, dto);
  }
}
