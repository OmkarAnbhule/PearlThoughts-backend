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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserType } from '../../common/enums/user-type.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../account/auth/jwt-payload.interface';
import { JwtAuthGuard } from '../account/auth/jwt-auth.guard';
import {
  BookableSlotDto,
  CancelAppointmentDto,
  CreateAppointmentDto,
  CreateAvailabilityOverrideDto,
  AppointmentResponseDto,
  DoctorScheduleViewDto,
  OverrideSummaryDto,
  RecurringAvailabilityEntryDto,
  ReplaceRecurringAvailabilityDto,
  ScheduleQueryDto,
  SlotsQueryDto,
} from './dto/appointment-schedule.dto';
import { AppointmentsService } from './appointments.service';
import { DoctorScheduleService } from './doctor-schedule.service';

@ApiTags('appointments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly doctorScheduleService: DoctorScheduleService,
  ) {}

  @Post('appointments')
  @Roles(UserType.Patient)
  @ApiOperation({ summary: 'Book an appointment with a doctor' })
  createAppointment(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.createAppointment(user.sub, dto);
  }

  @Get('appointments')
  @Roles(UserType.Patient)
  @ApiOperation({ summary: 'List appointments for the authenticated patient' })
  listPatientAppointments(
    @CurrentUser() user: JwtPayload,
  ): Promise<AppointmentResponseDto[]> {
    return this.appointmentsService.listPatientAppointments(user.sub);
  }

  @Patch('appointments/:id/cancel')
  @Roles(UserType.Patient, UserType.Doctor)
  @ApiOperation({ summary: 'Cancel an appointment' })
  cancelAppointment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) appointmentId: string,
    @Body() dto: CancelAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.cancelAppointment(
      user.sub,
      user.userType,
      appointmentId,
      dto,
    );
  }

  @Get('doctor/appointments')
  @Roles(UserType.Doctor)
  @ApiOperation({ summary: 'List appointments for the authenticated doctor' })
  listDoctorAppointments(
    @CurrentUser() user: JwtPayload,
  ): Promise<AppointmentResponseDto[]> {
    return this.appointmentsService.listDoctorAppointments(user.sub);
  }

  @Get('doctor/:id/schedule')
  @Roles(UserType.Patient)
  @ApiOperation({ summary: 'Get resolved doctor schedule for booking UI' })
  getDoctorSchedule(
    @Param('id', ParseUUIDPipe) doctorId: string,
    @Query() query: ScheduleQueryDto,
  ): Promise<DoctorScheduleViewDto> {
    return this.doctorScheduleService.getResolvedScheduleForDoctor(
      doctorId,
      query.from,
      query.to,
    );
  }

  @Get('doctor/:id/slots')
  @Roles(UserType.Patient)
  @ApiOperation({ summary: 'Get bookable slots for a doctor on a specific date' })
  getDoctorSlots(
    @Param('id', ParseUUIDPipe) doctorId: string,
    @Query() query: SlotsQueryDto,
  ): Promise<BookableSlotDto[]> {
    return this.doctorScheduleService.getBookableSlots(doctorId, query.date);
  }

  @Put('doctor/profile/availability')
  @Roles(UserType.Doctor)
  @ApiOperation({ summary: 'Replace recurring weekly availability' })
  replaceRecurringAvailability(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ReplaceRecurringAvailabilityDto,
  ): Promise<RecurringAvailabilityEntryDto[]> {
    return this.doctorScheduleService.replaceRecurringAvailability(
      user.sub,
      dto,
    );
  }

  @Get('doctor/schedule/overrides')
  @Roles(UserType.Doctor)
  @ApiOperation({ summary: 'List availability overrides for the authenticated doctor' })
  listOverrides(
    @CurrentUser() user: JwtPayload,
    @Query() query: ScheduleQueryDto,
  ): Promise<OverrideSummaryDto[]> {
    return this.doctorScheduleService.listOverrides(
      user.sub,
      query.from,
      query.to,
    );
  }

  @Post('doctor/schedule/overrides')
  @Roles(UserType.Doctor)
  @ApiOperation({ summary: 'Create an availability override' })
  createOverride(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAvailabilityOverrideDto,
  ): Promise<OverrideSummaryDto> {
    return this.doctorScheduleService.createOverride(user.sub, dto);
  }

  @Delete('doctor/schedule/overrides/:id')
  @Roles(UserType.Doctor)
  @ApiOperation({ summary: 'Delete an availability override' })
  deleteOverride(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) overrideId: string,
  ): Promise<void> {
    return this.doctorScheduleService.deleteOverride(user.sub, overrideId);
  }
}
