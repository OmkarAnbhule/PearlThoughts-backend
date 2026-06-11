import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DoctorAvailabilityEntry } from '../types/doctor-availability.type';
import { Appointment } from './appointment.entity';
import { DoctorAvailabilityOverride } from './doctor-availability-override.entity';
import { DoctorRecurringAvailability } from './doctor-recurring-availability.entity';
import { User } from './user.entity';

@Entity('doctor_profiles')
export class DoctorProfile {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  setId(): void {
    this.id ??= randomUUID();
  }

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.doctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'profile_image_url', type: 'varchar', nullable: true })
  profileImageUrl: string | null;

  @Column({ name: 'license_number', type: 'varchar', unique: true, nullable: true })
  licenseNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  specialization: string | null;

  @Column({ nullable: true })
  qualification: string | null;

  @Column({ name: 'years_of_experience', type: 'int', nullable: true })
  yearsOfExperience: number | null;

  @Column({ type: 'varchar', nullable: true })
  achievements: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  services: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  availability: DoctorAvailabilityEntry[] | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({
    name: 'consultation_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  consultationFee: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(
    () => DoctorRecurringAvailability,
    (availability) => availability.doctorProfile,
  )
  recurringAvailability?: DoctorRecurringAvailability[];

  @OneToMany(
    () => DoctorAvailabilityOverride,
    (override) => override.doctorProfile,
  )
  availabilityOverrides?: DoctorAvailabilityOverride[];

  @OneToMany(() => Appointment, (appointment) => appointment.doctorProfile)
  appointments?: Appointment[];
}
