import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserType } from '../../common/enums/user-type.enum';
import { toUserSummary } from './account.mapper';
import { AuthService } from './auth/auth.service';
import { LoginDto } from './dto/login.dto';
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

  private buildAuthResponse(user: User): AuthResponseDto {
    return {
      accessToken: this.authService.signToken(user),
      user: toUserSummary(user),
    };
  }
}
