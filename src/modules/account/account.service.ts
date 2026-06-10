import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthService } from './auth/auth.service';
import { LoginDto } from './dto/login.dto';
import {
  AuthResponseDto,
  ProfileResponseDto,
} from './dto/profile-response.dto';
import { SignupDto } from './dto/signup.dto';
import { toProfileResponse, toUserSummary } from './account.mapper';
import { DoctorProfile } from './entities/doctor-profile.entity';
import { PatientProfile } from './entities/patient-profile.entity';
import { User } from './entities/user.entity';

@Injectable()
export class AccountService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DoctorProfile)
    private readonly doctorProfileRepository: Repository<DoctorProfile>,
    @InjectRepository(PatientProfile)
    private readonly patientProfileRepository: Repository<PatientProfile>,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponseDto> {
    this.validateSignupProfiles(dto);

    const passwordHash = await this.authService.hashPassword(dto.password);

    const user = await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const createdUser = userRepo.create({
        email: dto.email.toLowerCase(),
        passwordHash,
        userType: dto.userType,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone ?? null,
        dateOfBirth: dto.dateOfBirth ?? null,
        gender: dto.gender ?? null,
        addressLine1: dto.addressLine1 ?? null,
        addressLine2: dto.addressLine2 ?? null,
        city: dto.city ?? null,
        state: dto.state ?? null,
        postalCode: dto.postalCode ?? null,
        country: dto.country ?? 'IN',
      });

      const savedUser = await userRepo.save(createdUser);

      if (dto.userType === UserType.Doctor && dto.doctorProfile) {
        const doctorRepo = manager.getRepository(DoctorProfile);
        const doctorProfile = doctorRepo.create({
          userId: savedUser.id,
          licenseNumber: dto.doctorProfile.licenseNumber,
          specialization: dto.doctorProfile.specialization,
          yearsOfExperience: dto.doctorProfile.yearsOfExperience ?? null,
          bio: dto.doctorProfile.bio ?? null,
          consultationFee:
            dto.doctorProfile.consultationFee != null
              ? dto.doctorProfile.consultationFee.toFixed(2)
              : null,
        });
        await doctorRepo.save(doctorProfile);
      }

      if (dto.userType === UserType.Patient && dto.patientProfile) {
        const patientRepo = manager.getRepository(PatientProfile);
        const patientProfile = patientRepo.create({
          userId: savedUser.id,
          bloodGroup: dto.patientProfile.bloodGroup ?? null,
          emergencyContactName: dto.patientProfile.emergencyContactName ?? null,
          emergencyContactPhone:
            dto.patientProfile.emergencyContactPhone ?? null,
          allergies: dto.patientProfile.allergies ?? null,
          medicalHistory: dto.patientProfile.medicalHistory ?? null,
          insuranceProvider: dto.patientProfile.insuranceProvider ?? null,
          insurancePolicyNumber:
            dto.patientProfile.insurancePolicyNumber ?? null,
        });
        await patientRepo.save(patientProfile);
      }

      return savedUser;
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    const validatedUser = await this.authService.validateUserCredentials(
      user,
      dto.password,
    );

    return this.buildAuthResponse(validatedUser);
  }

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        doctorProfile: true,
        patientProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    return toProfileResponse(user);
  }

  private validateSignupProfiles(dto: SignupDto): void {
    if (dto.userType === UserType.Doctor && !dto.doctorProfile) {
      throw new BadRequestException(
        'doctorProfile is required when userType is doctor',
      );
    }

    if (dto.userType === UserType.Patient && !dto.patientProfile) {
      throw new BadRequestException(
        'patientProfile is required when userType is patient',
      );
    }
  }

  private buildAuthResponse(user: User): AuthResponseDto {
    return {
      accessToken: this.authService.signToken(user),
      user: toUserSummary(user),
    };
  }
}
