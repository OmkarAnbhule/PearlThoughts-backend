import { Module } from '@nestjs/common';
import { AccountPersistenceModule } from '../account/account-persistence.module';
import { AuthModule } from '../account/auth/auth.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { DoctorScheduleService } from './doctor-schedule.service';

@Module({
  imports: [AccountPersistenceModule, AuthModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, DoctorScheduleService],
  exports: [AppointmentsService, DoctorScheduleService],
})
export class AppointmentsModule {}
