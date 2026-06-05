import { DoctorProfile } from './entities/doctor-profile.entity';
import { PatientProfile } from './entities/patient-profile.entity';
import { User } from './entities/user.entity';
import { DoctorProfileResponseDto } from './dto/doctor-profile.dto';
import { PatientProfileResponseDto } from './dto/patient-profile.dto';
import { UserSummaryDto } from './dto/profile-response.dto';

export function toUserSummary(user: User): UserSummaryDto {
  return {
    id: user.id,
    email: user.email,
    userType: user.userType,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

export function toDoctorProfileResponse(user: User): DoctorProfileResponseDto {
  const profile = user.doctorProfile;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: `Dr. ${user.firstName}`,
    profileImageUrl: profile?.profileImageUrl ?? null,
    specialization: profile?.specialization ?? null,
    yearsOfExperience: profile?.yearsOfExperience ?? null,
    achievements: profile?.achievements ?? null,
    services: profile?.services ?? null,
    availability: profile?.availability ?? null,
    bio: profile?.bio ?? null,
    licenseNumber: profile?.licenseNumber ?? null,
    consultationFee: profile?.consultationFee ?? null,
    createdAt: profile?.createdAt ?? user.createdAt,
    updatedAt: profile?.updatedAt ?? user.updatedAt,
  };
}

export function toPatientProfileResponse(user: User): PatientProfileResponseDto {
  const profile = user.patientProfile;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    bloodGroup: profile?.bloodGroup ?? null,
    emergencyContactName: profile?.emergencyContactName ?? null,
    emergencyContactPhone: profile?.emergencyContactPhone ?? null,
    allergies: profile?.allergies ?? null,
    medicalHistory: profile?.medicalHistory ?? null,
    insuranceProvider: profile?.insuranceProvider ?? null,
    insurancePolicyNumber: profile?.insurancePolicyNumber ?? null,
    createdAt: profile?.createdAt ?? user.createdAt,
    updatedAt: profile?.updatedAt ?? user.updatedAt,
  };
}
