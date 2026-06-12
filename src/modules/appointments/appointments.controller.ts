import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { JwtAuthGuard } from '../account/auth/jwt-auth.guard';
import { User } from '../account/entities/user.entity';
import {
  BookableSlotDto,
  CancelAppointmentDto,
  CreateAppointmentDto,
  AppointmentResponseDto,
  DoctorScheduleViewDto,
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
    @CurrentUser() user: User,
    @Body() dto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.createAppointment(user.id, dto);
  }

  @Get('appointments')
  @Roles(UserType.Patient)
  @ApiOperation({ summary: 'List appointments for the authenticated patient' })
  listPatientAppointments(
    @CurrentUser() user: User,
  ): Promise<AppointmentResponseDto[]> {
    return this.appointmentsService.listPatientAppointments(user.id);
  }

  @Patch('appointments/:id/cancel')
  @Roles(UserType.Patient, UserType.Doctor)
  @ApiOperation({ summary: 'Cancel an appointment' })
  cancelAppointment(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) appointmentId: string,
    @Body() dto: CancelAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.cancelAppointment(
      user.id,
      user.userType,
      appointmentId,
      dto,
    );
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
}
