import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AvailabilityOverrideType } from '../../../common/enums/availability-override-type.enum';
import { DoctorProfile } from './doctor-profile.entity';

@Entity('doctor_availability_overrides')
export class DoctorAvailabilityOverride {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  setId(): void {
    this.id ??= randomUUID();
  }

  @Column({ name: 'doctor_profile_id', type: 'uuid' })
  doctorProfileId: string;

  @ManyToOne(() => DoctorProfile, (profile) => profile.availabilityOverrides, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doctor_profile_id' })
  doctorProfile: DoctorProfile;

  @Column({ name: 'override_date', type: 'date' })
  overrideDate: string;

  @Column({
    name: 'override_type',
    type: 'enum',
    enum: AvailabilityOverrideType,
  })
  overrideType: AvailabilityOverrideType;

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime: string | null;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime: string | null;

  @Column({ name: 'blocked_start_time', type: 'time', nullable: true })
  blockedStartTime: string | null;

  @Column({ name: 'blocked_end_time', type: 'time', nullable: true })
  blockedEndTime: string | null;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
