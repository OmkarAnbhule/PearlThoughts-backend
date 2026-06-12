import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { DoctorAvailabilityOverride } from './entities/doctor-availability-override.entity';
import { DoctorProfile } from './entities/doctor-profile.entity';
import { DoctorRecurringAvailability } from './entities/doctor-recurring-availability.entity';
import { PatientProfile } from './entities/patient-profile.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      DoctorProfile,
      PatientProfile,
      DoctorRecurringAvailability,
      DoctorAvailabilityOverride,
      Appointment,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class AccountPersistenceModule {}
