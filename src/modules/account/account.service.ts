import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserType } from '../../common/enums/user-type.enum';
import {
  toDoctorProfileResponse,
  toPatientProfileResponse,
  toUserSummary,
} from './account.mapper';
import { AuthService } from './auth/auth.service';
import { DoctorProfileResponseDto } from './dto/doctor-profile.dto';
import { LoginDto } from './dto/login.dto';
import { PatientProfileResponseDto } from './dto/patient-profile.dto';
import { AuthResponseDto } from './dto/profile-response.dto';
import { SignupDto } from './dto/signup.dto';
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
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponseDto> {
    const passwordHash = await this.authService.hashPassword(dto.password);

    const user = await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const createdUser = userRepo.create({
        email: dto.email.toLowerCase(),
        passwordHash,
        userType: dto.userType,
        firstName: dto.firstName,
        lastName: dto.lastName,
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

  async getDoctorProfile(userId: string): Promise<DoctorProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, userType: UserType.Doctor },
      relations: { doctorProfile: true },
    });

    if (!user) {
      throw new NotFoundException('Doctor profile not found');
    }

    return toDoctorProfileResponse(user);
  }

  async getPatientProfile(userId: string): Promise<PatientProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, userType: UserType.Patient },
      relations: { patientProfile: true },
    });

    if (!user) {
      throw new NotFoundException('Patient profile not found');
    }

    return toPatientProfileResponse(user);
  }

  private buildAuthResponse(user: User): AuthResponseDto {
    return {
      accessToken: this.authService.signToken(user),
      user: toUserSummary(user),
    };
  }
}
