import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { DoctorAvailabilityStatus } from '../../common/enums/doctor-availability-status.enum';
import { UserType } from '../../common/enums/user-type.enum';
import {
  toDoctorDetailResponse,
  toDoctorListItem,
} from './account.mapper';
import {
  DoctorDetailResponseDto,
  DoctorListResponseDto,
  ListDoctorsQueryDto,
} from './dto/doctor-list.dto';
import { DoctorProfile } from './entities/doctor-profile.entity';
import { getDoctorAvailabilityStatus } from './utils/doctor-availability.util';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(DoctorProfile)
    private readonly doctorProfileRepository: Repository<DoctorProfile>,
  ) {}

  async listDoctors(query: ListDoctorsQueryDto): Promise<DoctorListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const profiles = await this.buildDoctorListQuery(query)
      .orderBy('doctor.id', 'ASC')
      .getMany();

    let items = profiles.map(toDoctorListItem);

    if (query.availability === 'true') {
      items = items.filter(
        (item) => item.availabilityStatus === DoctorAvailabilityStatus.Available,
      );
    }

    const total = items.length;
    const offset = (page - 1) * limit;
    const data = items.slice(offset, offset + limit);

    return {
      data,
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  private buildDoctorListQuery(query: ListDoctorsQueryDto) {
    const qb = this.doctorProfileRepository
      .createQueryBuilder('doctor')
      .innerJoinAndSelect('doctor.user', 'user')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('user.userType = :userType', { userType: UserType.Doctor })
      .andWhere('user.firstName IS NOT NULL')
      .andWhere('user.lastName IS NOT NULL')
      .andWhere('doctor.specialization IS NOT NULL')
      .andWhere('doctor.qualification IS NOT NULL')
      .andWhere('doctor.yearsOfExperience IS NOT NULL')
      .andWhere('doctor.consultationFee IS NOT NULL')
      .andWhere('doctor.availability IS NOT NULL');

    if (query.specialization) {
      qb.andWhere('LOWER(doctor.specialization) = LOWER(:specialization)', {
        specialization: query.specialization.trim(),
      });
    }

    if (query.search) {
      const searchTerm = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((subQuery) => {
          subQuery
            .where('LOWER(user.firstName) LIKE :searchTerm', { searchTerm })
            .orWhere('LOWER(user.lastName) LIKE :searchTerm', { searchTerm })
            .orWhere(
              "LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE :searchTerm",
              { searchTerm },
            );
        }),
      );
    }

    return qb;
  }

  async getDoctorById(doctorId: string): Promise<DoctorDetailResponseDto> {
    const profile = await this.findOnboardedDoctorProfile(doctorId);

    if (!profile) {
      throw new NotFoundException('Doctor not found');
    }

    return toDoctorDetailResponse(profile);
  }

  private async findOnboardedDoctorProfile(
    doctorId: string,
  ): Promise<DoctorProfile | null> {
    return this.doctorProfileRepository
      .createQueryBuilder('doctor')
      .innerJoinAndSelect('doctor.user', 'user')
      .where('doctor.id = :doctorId', { doctorId })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('user.userType = :userType', { userType: UserType.Doctor })
      .andWhere('user.firstName IS NOT NULL')
      .andWhere('user.lastName IS NOT NULL')
      .andWhere('doctor.specialization IS NOT NULL')
      .andWhere('doctor.qualification IS NOT NULL')
      .andWhere('doctor.yearsOfExperience IS NOT NULL')
      .andWhere('doctor.consultationFee IS NOT NULL')
      .andWhere('doctor.availability IS NOT NULL')
      .getOne();
  }
}
