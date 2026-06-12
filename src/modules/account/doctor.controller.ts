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
  AvailabilityDateQueryDto,
  CreateAvailabilityOverrideDto,
  OverrideSummaryDto,
  RecurringAvailabilityEntryDto,
  RecurringAvailabilityResponseDto,
  ReplaceRecurringAvailabilityDto,
  ResolvedDayAvailabilityDto,
  ScheduleQueryDto,
  UpdateRecurringAvailabilityDto,
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

  @Post('availability')
  @ApiOperation({ summary: 'Create a recurring availability window' })
  @ApiCreatedResponse({ type: RecurringAvailabilityResponseDto })
  createAvailability(
    @CurrentUser() user: User,
    @Body() dto: RecurringAvailabilityEntryDto,
  ): Promise<RecurringAvailabilityResponseDto> {
    return this.doctorScheduleService.createRecurringAvailability(user.id, dto);
  }

  @Get('availability')
  @ApiOperation({ summary: 'List recurring weekly availability' })
  @ApiOkResponse({ type: [RecurringAvailabilityResponseDto] })
  listAvailability(
    @CurrentUser() user: User,
  ): Promise<RecurringAvailabilityResponseDto[]> {
    return this.doctorScheduleService.listRecurringAvailability(user.id);
  }

  @Patch('availability/:id')
  @ApiOperation({ summary: 'Update a recurring availability window' })
  @ApiOkResponse({ type: RecurringAvailabilityResponseDto })
  updateAvailability(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) availabilityId: string,
    @Body() dto: UpdateRecurringAvailabilityDto,
  ): Promise<RecurringAvailabilityResponseDto> {
    return this.doctorScheduleService.updateRecurringAvailability(
      user.id,
      availabilityId,
      dto,
    );
  }

  @Delete('availability/:id')
  @ApiOperation({ summary: 'Delete a recurring availability window' })
  deleteAvailability(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) availabilityId: string,
  ): Promise<void> {
    return this.doctorScheduleService.deleteRecurringAvailability(
      user.id,
      availabilityId,
    );
  }

  @Put('profile/availability')
  @ApiOperation({ summary: 'Replace all recurring weekly availability' })
  @ApiOkResponse({ type: [RecurringAvailabilityResponseDto] })
  replaceRecurringAvailability(
    @CurrentUser() user: User,
    @Body() dto: ReplaceRecurringAvailabilityDto,
  ): Promise<RecurringAvailabilityResponseDto[]> {
    return this.doctorScheduleService.replaceRecurringAvailability(user.id, dto);
  }

  @Post('availability/override')
  @ApiOperation({ summary: 'Create a custom date availability override' })
  @ApiCreatedResponse({ type: OverrideSummaryDto })
  createAvailabilityOverride(
    @CurrentUser() user: User,
    @Body() dto: CreateAvailabilityOverrideDto,
  ): Promise<OverrideSummaryDto> {
    return this.doctorScheduleService.createOverride(user.id, dto);
  }

  @Get('availability/date')
  @ApiOperation({ summary: 'Get resolved availability for a specific date' })
  @ApiOkResponse({ type: ResolvedDayAvailabilityDto })
  getAvailabilityForDate(
    @CurrentUser() user: User,
    @Query() query: AvailabilityDateQueryDto,
  ): Promise<ResolvedDayAvailabilityDto> {
    return this.doctorScheduleService.getAvailabilityForDate(
      user.id,
      query.date,
    );
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
  @ApiOperation({ summary: 'List availability overrides for a date range' })
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

  @Delete('schedule/overrides/:id')
  @ApiOperation({ summary: 'Delete an availability override' })
  deleteOverride(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) overrideId: string,
  ): Promise<void> {
    return this.doctorScheduleService.deleteOverride(user.id, overrideId);
  }
}
