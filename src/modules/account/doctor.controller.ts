import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
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
import {
  AppointmentResponseDto,
  CreateAvailabilityOverrideDto,
  OverrideSummaryDto,
  RecurringAvailabilityEntryDto,
  ReplaceRecurringAvailabilityDto,
  ScheduleQueryDto,
} from '../appointments/dto/appointment-schedule.dto';
import { AppointmentsService } from '../appointments/appointments.service';
import { DoctorScheduleService } from '../appointments/doctor-schedule.service';
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
  constructor(
    private readonly accountService: AccountService,
    private readonly appointmentsService: AppointmentsService,
    private readonly doctorScheduleService: DoctorScheduleService,
  ) {}

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

  @Put('profile/availability')
  @ApiOperation({ summary: 'Replace recurring weekly availability' })
  @ApiOkResponse({ type: [RecurringAvailabilityEntryDto] })
  replaceRecurringAvailability(
    @CurrentUser() user: User,
    @Body() dto: ReplaceRecurringAvailabilityDto,
  ): Promise<RecurringAvailabilityEntryDto[]> {
    return this.doctorScheduleService.replaceRecurringAvailability(user.id, dto);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'List appointments for the authenticated doctor' })
  @ApiOkResponse({ type: [AppointmentResponseDto] })
  listDoctorAppointments(
    @CurrentUser() user: User,
  ): Promise<AppointmentResponseDto[]> {
    return this.appointmentsService.listDoctorAppointments(user.id);
  }

  @Get('schedule/overrides')
  @ApiOperation({ summary: 'List availability overrides for the authenticated doctor' })
  @ApiOkResponse({ type: [OverrideSummaryDto] })
  listOverrides(
    @CurrentUser() user: User,
    @Query() query: ScheduleQueryDto,
  ): Promise<OverrideSummaryDto[]> {
    return this.doctorScheduleService.listOverrides(
      user.id,
      query.from,
      query.to,
    );
  }

  @Post('schedule/overrides')
  @ApiOperation({ summary: 'Create an availability override' })
  @ApiOkResponse({ type: OverrideSummaryDto })
  createOverride(
    @CurrentUser() user: User,
    @Body() dto: CreateAvailabilityOverrideDto,
  ): Promise<OverrideSummaryDto> {
    return this.doctorScheduleService.createOverride(user.id, dto);
  }

  @Delete('schedule/overrides/:id')
  @ApiOperation({ summary: 'Delete an availability override' })
  deleteOverride(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) overrideId: string,
  ): Promise<void> {
    return this.doctorScheduleService.deleteOverride(user.id, overrideId);
  }
}
