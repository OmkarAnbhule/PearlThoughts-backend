import { UserType } from '../../common/enums/user-type.enum';
import { DoctorProfile } from './entities/doctor-profile.entity';
import { PatientProfile } from './entities/patient-profile.entity';
import { User } from './entities/user.entity';
import { DoctorProfileResponseDto } from './dto/doctor-profile.dto';
import { PatientProfileResponseDto } from './dto/patient-profile.dto';
import { ProfileResponseDto, UserSummaryDto } from './dto/profile-response.dto';

export function computeAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

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
    specialization: profile.specialization,
    qualification: profile.qualification,
    yearsOfExperience: profile.yearsOfExperience,
    bio: profile.bio,
    consultationFee: profile.consultationFee,
    availability: profile.availability,
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
    age: computeAge(user.dateOfBirth),
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
