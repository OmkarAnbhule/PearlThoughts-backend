import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BloodGroup } from '../../../common/enums/blood-group.enum';
import { User } from './user.entity';

@Entity('patient_profiles')
export class PatientProfile {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  setId(): void {
    this.id ??= randomUUID();
  }

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.patientProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'blood_group',
    type: 'enum',
    enum: BloodGroup,
    nullable: true,
  })
  bloodGroup: BloodGroup | null;

  @Column({ name: 'emergency_contact_name', type: 'varchar', nullable: true })
  emergencyContactName: string | null;

  @Column({ name: 'emergency_contact_phone', type: 'varchar', nullable: true })
  emergencyContactPhone: string | null;

  @Column({ type: 'text', nullable: true })
  allergies: string | null;

  @Column({ name: 'medical_history', type: 'text', nullable: true })
  medicalHistory: string | null;

  @Column({ name: 'insurance_provider', type: 'varchar', nullable: true })
  insuranceProvider: string | null;

  @Column({ name: 'insurance_policy_number', type: 'varchar', nullable: true })
  insurancePolicyNumber: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
