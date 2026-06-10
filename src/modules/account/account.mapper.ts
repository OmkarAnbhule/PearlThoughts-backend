import { UserType } from '../../common/enums/user-type.enum';
import { DoctorProfile } from './entities/doctor-profile.entity';
import { PatientProfile } from './entities/patient-profile.entity';
import { User } from './entities/user.entity';
import { DoctorProfileResponseDto } from './dto/doctor-profile.dto';
import { PatientProfileResponseDto } from './dto/patient-profile.dto';
import { ProfileResponseDto, UserSummaryDto } from './dto/profile-response.dto';

export function toUserSummary(user: User): UserSummaryDto {
  return {
    id: user.id,
    email: user.email,
    userType: user.userType,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

export function toDoctorProfileResponse(
  profile: DoctorProfile,
): DoctorProfileResponseDto {
  return {
    id: profile.id,
    licenseNumber: profile.licenseNumber,
    specialization: profile.specialization,
    yearsOfExperience: profile.yearsOfExperience,
    bio: profile.bio,
    consultationFee: profile.consultationFee,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function toPatientProfileResponse(
  profile: PatientProfile,
): PatientProfileResponseDto {
  return {
    id: profile.id,
    bloodGroup: profile.bloodGroup,
    emergencyContactName: profile.emergencyContactName,
    emergencyContactPhone: profile.emergencyContactPhone,
    allergies: profile.allergies,
    medicalHistory: profile.medicalHistory,
    insuranceProvider: profile.insuranceProvider,
    insurancePolicyNumber: profile.insurancePolicyNumber,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function toProfileResponse(user: User): ProfileResponseDto {
  const response: ProfileResponseDto = {
    id: user.id,
    email: user.email,
    userType: user.userType,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    addressLine1: user.addressLine1,
    addressLine2: user.addressLine2,
    city: user.city,
    state: user.state,
    postalCode: user.postalCode,
    country: user.country,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (user.userType === UserType.Doctor && user.doctorProfile) {
    response.doctorProfile = toDoctorProfileResponse(user.doctorProfile);
  }

  if (user.userType === UserType.Patient && user.patientProfile) {
    response.patientProfile = toPatientProfileResponse(user.patientProfile);
  }

  return response;
}
