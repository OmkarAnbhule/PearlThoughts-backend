import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppointmentsModule } from '../appointments/appointments.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountPersistenceModule } from './account-persistence.module';
import { AuthModule } from './auth/auth.module';
import { DoctorController } from './doctor.controller';
import { DoctorDiscoveryController } from './doctor-discovery.controller';
import { DoctorsService } from './doctors.service';
import { PatientController } from './patient.controller';

@Module({
  imports: [AccountPersistenceModule, AuthModule, AppointmentsModule],
  controllers: [
    AccountController,
    DoctorController,
    DoctorDiscoveryController,
    PatientController,
  ],
  providers: [AccountService, DoctorsService, RolesGuard],
  exports: [AccountService, DoctorsService],
})
export class AccountModule {}
