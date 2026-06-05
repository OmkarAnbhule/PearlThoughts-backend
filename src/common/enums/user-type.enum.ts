export enum UserType {
  Patient = 'patient',
  Doctor = 'doctor',
  Staff = 'staff',
  Admin = 'admin',
}

export const PUBLIC_SIGNUP_USER_TYPES = [
  UserType.Patient,
  UserType.Doctor,
] as const;
