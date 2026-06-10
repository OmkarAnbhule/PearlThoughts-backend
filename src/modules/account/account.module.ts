import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AuthModule } from './auth/auth.module';
import { DoctorController } from './doctor.controller';
import { DoctorDiscoveryController } from './doctor-discovery.controller';
import { DoctorsService } from './doctors.service';
import { PatientController } from './patient.controller';
import { DoctorProfile } from './entities/doctor-profile.entity';
import { PatientProfile } from './entities/patient-profile.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, DoctorProfile, PatientProfile]),
    AuthModule,
  ],
  controllers: [
    AccountController,
    DoctorController,
    DoctorDiscoveryController,
    PatientController,
  ],
  providers: [AccountService, DoctorsService, RolesGuard],
  exports: [AccountService],
})
export class AccountModule {}
