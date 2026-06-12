import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { UserType } from '../../common/enums/user-type.enum';
import { toProfileResponse, toUserSummary } from './account.mapper';
import { AuthService } from './auth/auth.service';
import {
  CreateDoctorProfileDto,
  UpdateDoctorProfileDto,
} from './dto/doctor-profile.dto';
import { LoginDto } from './dto/login.dto';
import {
  CreatePatientProfileDto,
  UpdatePatientProfileDto,
} from './dto/patient-profile.dto';
import {
  AuthResponseDto,
  ProfileResponseDto,
} from './dto/profile-response.dto';
import { SignupDto } from './dto/signup.dto';
import { DoctorProfile } from './entities/doctor-profile.entity';
import { PatientProfile } from './entities/patient-profile.entity';
import { User } from './entities/user.entity';
import { DoctorScheduleService } from '../appointments/doctor-schedule.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
    private readonly doctorScheduleService: DoctorScheduleService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponseDto> {
    const passwordHash = await this.authService.hashPassword(dto.password);

    const user = await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const createdUser = userRepo.create({
        email: dto.email.toLowerCase(),
        passwordHash,
        userType: dto.userType,
        firstName: null,
        lastName: null,
        country: 'IN',
      });

      const savedUser = await userRepo.save(createdUser);

      if (dto.userType === UserType.Doctor) {
        const doctorRepo = manager.getRepository(DoctorProfile);
        await doctorRepo.save(doctorRepo.create({ userId: savedUser.id }));
      }

      if (dto.userType === UserType.Patient) {
        const patientRepo = manager.getRepository(PatientProfile);
        await patientRepo.save(patientRepo.create({ userId: savedUser.id }));
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
    const user = await this.loadUserWithProfiles(userId);

    if (!user) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    return toProfileResponse(user);
  }

  async createDoctorProfile(
    userId: string,
    dto: CreateDoctorProfileDto,
  ): Promise<ProfileResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const user = await this.loadUserWithProfiles(userId, manager);

      if (!user?.doctorProfile) {
        throw new NotFoundException('Doctor profile not found');
      }

      if (this.isDoctorProfileComplete(user, user.doctorProfile)) {
        throw new ConflictException('Doctor profile already exists');
      }

      user.firstName = dto.firstName;
      user.lastName = dto.lastName;
      this.applyDoctorProfileFields(user.doctorProfile, dto);

      await manager.getRepository(User).save(user);
      await manager.getRepository(DoctorProfile).save(user.doctorProfile);

      if (dto.availability) {
        await this.doctorScheduleService.syncRecurringAvailability(
          user.doctorProfile.id,
          dto.availability,
          manager,
        );
      }
    });

    return toProfileResponse(await this.requireUserWithProfiles(userId));
  }

  async updateDoctorProfile(
    userId: string,
    dto: UpdateDoctorProfileDto,
  ): Promise<ProfileResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const user = await this.loadUserWithProfiles(userId, manager);

      if (!user?.doctorProfile) {
        throw new NotFoundException('Doctor profile not found');
      }

      if (!this.isDoctorProfileComplete(user, user.doctorProfile)) {
        throw new BadRequestException(
          'Complete doctor profile before updating',
        );
      }

      this.applyDoctorUserFields(user, dto);
      this.applyDoctorProfileFields(user.doctorProfile, dto);

      await manager.getRepository(User).save(user);
      await manager.getRepository(DoctorProfile).save(user.doctorProfile);

      if (dto.availability) {
        await this.doctorScheduleService.syncRecurringAvailability(
          user.doctorProfile.id,
          dto.availability,
          manager,
        );
      }
    });

    return toProfileResponse(await this.requireUserWithProfiles(userId));
  }

  async createPatientProfile(
    userId: string,
    dto: CreatePatientProfileDto,
  ): Promise<ProfileResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const user = await this.loadUserWithProfiles(userId, manager);

      if (!user?.patientProfile) {
        throw new NotFoundException('Patient profile not found');
      }

      if (this.isPatientProfileComplete(user)) {
        throw new ConflictException('Patient profile already exists');
      }

      this.applyPatientUserFields(user, dto);
      this.applyPatientProfileFields(user.patientProfile, dto);

      await manager.getRepository(User).save(user);
      await manager.getRepository(PatientProfile).save(user.patientProfile);
    });

    return toProfileResponse(await this.requireUserWithProfiles(userId));
  }

  async updatePatientProfile(
    userId: string,
    dto: UpdatePatientProfileDto,
  ): Promise<ProfileResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const user = await this.loadUserWithProfiles(userId, manager);

      if (!user?.patientProfile) {
        throw new NotFoundException('Patient profile not found');
      }

      if (!this.isPatientProfileComplete(user)) {
        throw new BadRequestException(
          'Complete patient profile before updating',
        );
      }

      this.applyPatientUserFields(user, dto);
      this.applyPatientProfileFields(user.patientProfile, dto);

      await manager.getRepository(User).save(user);
      await manager.getRepository(PatientProfile).save(user.patientProfile);
    });

    return toProfileResponse(await this.requireUserWithProfiles(userId));
  }

  private async requireUserWithProfiles(userId: string): Promise<User> {
    const user = await this.loadUserWithProfiles(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async loadUserWithProfiles(
    userId: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    const userRepo = manager ? manager.getRepository(User) : this.userRepository;

    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }

    if (user.userType === UserType.Doctor) {
      const doctorRepo = manager
        ? manager.getRepository(DoctorProfile)
        : this.dataSource.getRepository(DoctorProfile);
      user.doctorProfile =
        (await doctorRepo.findOne({ where: { userId } })) ?? undefined;
    }

    if (user.userType === UserType.Patient) {
      const patientRepo = manager
        ? manager.getRepository(PatientProfile)
        : this.dataSource.getRepository(PatientProfile);
      user.patientProfile =
        (await patientRepo.findOne({ where: { userId } })) ?? undefined;
    }

    return user;
  }

  private isDoctorProfileComplete(
    user: User,
    profile: DoctorProfile,
  ): boolean {
    return (
      user.firstName != null &&
      user.lastName != null &&
      profile.specialization != null &&
      profile.qualification != null &&
      profile.yearsOfExperience != null &&
      profile.consultationFee != null &&
      profile.availability != null &&
      profile.availability.length > 0
    );
  }

  private isPatientProfileComplete(user: User): boolean {
    return (
      user.firstName != null &&
      user.lastName != null &&
      user.dateOfBirth != null &&
      user.gender != null &&
      user.phone != null
    );
  }

  private applyDoctorUserFields(
    user: User,
    dto: UpdateDoctorProfileDto,
  ): void {
    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }
  }

  private applyDoctorProfileFields(
    profile: DoctorProfile,
    dto: CreateDoctorProfileDto | UpdateDoctorProfileDto,
  ): void {
    if (dto.specialization !== undefined) {
      profile.specialization = dto.specialization;
    }
    if (dto.qualification !== undefined) {
      profile.qualification = dto.qualification;
    }
    if (dto.yearsOfExperience !== undefined) {
      profile.yearsOfExperience = dto.yearsOfExperience;
    }
    if (dto.bio !== undefined) {
      profile.bio = dto.bio;
    }
    if (dto.consultationFee !== undefined) {
      profile.consultationFee = dto.consultationFee.toFixed(2);
    }
  }

  private applyPatientUserFields(
    user: User,
    dto: CreatePatientProfileDto | UpdatePatientProfileDto,
  ): void {
    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }
    if (dto.dateOfBirth !== undefined) {
      user.dateOfBirth = dto.dateOfBirth;
    }
    if (dto.gender !== undefined) {
      user.gender = dto.gender;
    }
    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }
  }

  private applyPatientProfileFields(
    profile: PatientProfile,
    dto: CreatePatientProfileDto | UpdatePatientProfileDto,
  ): void {
    if (dto.bloodGroup !== undefined) {
      profile.bloodGroup = dto.bloodGroup;
    }
    if (dto.emergencyContactName !== undefined) {
      profile.emergencyContactName = dto.emergencyContactName;
    }
    if (dto.emergencyContactPhone !== undefined) {
      profile.emergencyContactPhone = dto.emergencyContactPhone;
    }
    if (dto.allergies !== undefined) {
      profile.allergies = dto.allergies;
    }
    if (dto.medicalHistory !== undefined) {
      profile.medicalHistory = dto.medicalHistory;
    }
    if (dto.insuranceProvider !== undefined) {
      profile.insuranceProvider = dto.insuranceProvider;
    }
    if (dto.insurancePolicyNumber !== undefined) {
      profile.insurancePolicyNumber = dto.insurancePolicyNumber;
    }
  }

  private buildAuthResponse(user: User): AuthResponseDto {
    return {
      accessToken: this.authService.signToken(user),
      user: toUserSummary(user),
    };
  }
}
