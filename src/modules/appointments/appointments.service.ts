import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { Appointment } from '../account/entities/appointment.entity';
import { DoctorProfile } from '../account/entities/doctor-profile.entity';
import { User } from '../account/entities/user.entity';
import {
  AppointmentResponseDto,
  CancelAppointmentDto,
  CreateAppointmentDto,
} from './dto/appointment-schedule.dto';
import { DoctorScheduleService } from './doctor-schedule.service';
import {
  DEFAULT_SLOT_DURATION_MINUTES,
  generateBookableSlots,
  parseTimeToMinutes,
  resolveDayAvailability,
} from './utils/schedule-resolution.util';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly doctorScheduleService: DoctorScheduleService,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(DoctorProfile)
    private readonly doctorProfileRepository: Repository<DoctorProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createAppointment(
    patientUserId: string,
    dto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const doctor = await this.findBookableDoctor(dto.doctorId);
    const patient = await this.userRepository.findOne({
      where: { id: patientUserId, userType: UserType.Patient, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const scheduledStart = new Date(`${dto.date}T${dto.startTime}:00`);
    if (Number.isNaN(scheduledStart.getTime())) {
      throw new BadRequestException('Invalid appointment date or time');
    }

    if (scheduledStart.getTime() <= Date.now()) {
      throw new BadRequestException('Cannot book appointments in the past');
    }

    const recurring = await this.doctorScheduleService.loadRecurringSlots(
      doctor.id,
    );
    const overrides = await this.doctorScheduleService.loadOverridesForDate(
      doctor.id,
      dto.date,
    );
    const resolved = resolveDayAvailability(
      recurring,
      overrides,
      new Date(`${dto.date}T00:00:00`),
    );
    const availableSlots = generateBookableSlots(resolved);
    const isSlotAvailable = availableSlots.some(
      (slot) => slot.startTime === dto.startTime,
    );

    if (!isSlotAvailable) {
      throw new BadRequestException('Selected time slot is not available');
    }

    const scheduledEnd = new Date(scheduledStart);
    scheduledEnd.setMinutes(
      scheduledEnd.getMinutes() + DEFAULT_SLOT_DURATION_MINUTES,
    );

    try {
      const saved = await this.dataSource.transaction(async (manager) => {
        const appointmentRepo = manager.getRepository(Appointment);
        const conflicting = await appointmentRepo
          .createQueryBuilder('appointment')
          .where('appointment.doctor_profile_id = :doctorProfileId', {
            doctorProfileId: doctor.id,
          })
          .andWhere('appointment.scheduled_start = :scheduledStart', {
            scheduledStart,
          })
          .andWhere('appointment.status IN (:...statuses)', {
            statuses: [AppointmentStatus.Pending, AppointmentStatus.Confirmed],
          })
          .setLock('pessimistic_write')
          .getOne();

        if (conflicting) {
          throw new ConflictException('Selected time slot is already booked');
        }

        return appointmentRepo.save(
          appointmentRepo.create({
            doctorProfileId: doctor.id,
            patientUserId,
            scheduledStart,
            scheduledEnd,
            status: AppointmentStatus.Confirmed,
            notes: dto.notes ?? null,
          }),
        );
      });

      return this.toAppointmentResponse(saved, doctor, patient);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('Selected time slot is already booked');
      }

      throw error;
    }
  }

  async listPatientAppointments(
    patientUserId: string,
  ): Promise<AppointmentResponseDto[]> {
    const appointments = await this.appointmentRepository.find({
      where: { patientUserId },
      relations: { doctorProfile: { user: true } },
      order: { scheduledStart: 'ASC' },
    });

    return appointments.map((appointment) =>
      this.toAppointmentResponse(
        appointment,
        appointment.doctorProfile,
        { id: patientUserId, firstName: null, lastName: null } as User,
      ),
    );
  }

  async listDoctorAppointments(
    doctorUserId: string,
  ): Promise<AppointmentResponseDto[]> {
    const doctor = await this.doctorProfileRepository.findOne({
      where: { userId: doctorUserId },
      relations: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    const appointments = await this.appointmentRepository.find({
      where: { doctorProfileId: doctor.id },
      relations: { patient: true },
      order: { scheduledStart: 'ASC' },
    });

    return appointments.map((appointment) =>
      this.toAppointmentResponse(appointment, doctor, appointment.patient),
    );
  }

  async cancelAppointment(
    userId: string,
    userType: UserType,
    appointmentId: string,
    dto: CancelAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: {
        doctorProfile: { user: true },
        patient: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const isPatientOwner =
      userType === UserType.Patient && appointment.patientUserId === userId;
    const isDoctorOwner =
      userType === UserType.Doctor &&
      appointment.doctorProfile.userId === userId;

    if (!isPatientOwner && !isDoctorOwner) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.Cancelled) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    appointment.status = AppointmentStatus.Cancelled;
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = dto.cancellationReason ?? null;

    const saved = await this.appointmentRepository.save(appointment);
    return this.toAppointmentResponse(
      saved,
      appointment.doctorProfile,
      appointment.patient,
    );
  }

  private async findBookableDoctor(doctorId: string): Promise<DoctorProfile> {
    const doctor = await this.doctorProfileRepository
      .createQueryBuilder('doctor')
      .innerJoinAndSelect('doctor.user', 'user')
      .where('doctor.id = :doctorId', { doctorId })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('user.userType = :userType', { userType: UserType.Doctor })
      .andWhere('user.firstName IS NOT NULL')
      .andWhere('user.lastName IS NOT NULL')
      .andWhere('doctor.specialization IS NOT NULL')
      .andWhere('doctor.qualification IS NOT NULL')
      .andWhere('doctor.yearsOfExperience IS NOT NULL')
      .andWhere('doctor.consultationFee IS NOT NULL')
      .getOne();

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const recurring = await this.doctorScheduleService.loadRecurringSlots(
      doctor.id,
    );

    if (recurring.length === 0 && !doctor.availability?.length) {
      throw new BadRequestException('Doctor has no availability configured');
    }

    return doctor;
  }

  private toAppointmentResponse(
    appointment: Appointment,
    doctor: DoctorProfile,
    patient: User,
  ): AppointmentResponseDto {
    const doctorUser = doctor.user;
    const doctorName =
      doctorUser?.firstName && doctorUser?.lastName
        ? `${doctorUser.firstName} ${doctorUser.lastName}`
        : 'Doctor';

    return {
      id: appointment.id,
      doctorId: appointment.doctorProfileId,
      doctorName,
      patientUserId: appointment.patientUserId,
      scheduledStart: appointment.scheduledStart,
      scheduledEnd: appointment.scheduledEnd,
      status: appointment.status,
      notes: appointment.notes,
    };
  }
}
