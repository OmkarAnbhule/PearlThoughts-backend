import { Module } from '@nestjs/common';
import { AccountPersistenceModule } from '../account/account-persistence.module';
import { AuthModule } from '../account/auth/auth.module';
import { DoctorScheduleService } from './doctor-schedule.service';

@Module({
  imports: [AccountPersistenceModule, AuthModule],
  providers: [DoctorScheduleService],
  exports: [DoctorScheduleService],
})
export class AppointmentsModule {}
