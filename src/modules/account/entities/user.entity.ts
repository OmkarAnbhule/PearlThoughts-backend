import { randomUUID } from 'crypto';
import { Exclude } from 'class-transformer';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gender } from '../../../common/enums/gender.enum';
import { UserType } from '../../../common/enums/user-type.enum';
import { DoctorProfile } from './doctor-profile.entity';
import { PatientProfile } from './patient-profile.entity';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  setId(): void {
    this.id ??= randomUUID();
  }

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserType,
    name: 'user_type',
  })
  userType: UserType;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'date', name: 'date_of_birth', nullable: true })
  dateOfBirth: string | null;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender | null;

  @Column({ name: 'address_line1', type: 'varchar', nullable: true })
  addressLine1: string | null;

  @Column({ name: 'address_line2', type: 'varchar', nullable: true })
  addressLine2: string | null;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ type: 'varchar', nullable: true })
  state: string | null;

  @Column({ name: 'postal_code', type: 'varchar', nullable: true })
  postalCode: string | null;

  @Column({ type: 'varchar', default: 'IN' })
  country: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => DoctorProfile, (profile) => profile.user)
  doctorProfile?: DoctorProfile;

  @OneToOne(() => PatientProfile, (profile) => profile.user)
  patientProfile?: PatientProfile;
}
