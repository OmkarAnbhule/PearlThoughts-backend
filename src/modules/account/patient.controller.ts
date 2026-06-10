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
  CreatePatientProfileDto,
  UpdatePatientProfileDto,
} from './dto/patient-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { User } from './entities/user.entity';

@ApiTags('Patient')
@Controller('patient')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.Patient)
@ApiBearerAuth('access-token')
export class PatientController {
  constructor(private readonly accountService: AccountService) {}

  @Post('profile')
  @ApiOperation({ summary: 'Create patient profile (onboarding)' })
  @ApiCreatedResponse({ type: ProfileResponseDto })
  @ApiForbiddenResponse({ description: 'Patient role required' })
  createProfile(
    @CurrentUser() user: User,
    @Body() dto: CreatePatientProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.accountService.createPatientProfile(user.id, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get the authenticated patient profile' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Patient role required' })
  getProfile(@CurrentUser() user: User): Promise<ProfileResponseDto> {
    return this.accountService.getProfile(user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update patient profile fields' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiForbiddenResponse({ description: 'Patient role required' })
  updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdatePatientProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.accountService.updatePatientProfile(user.id, dto);
  }
}
