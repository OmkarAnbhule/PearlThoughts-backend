import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import authConfig from '../src/config/auth.config';
import { BloodGroup } from '../src/common/enums/blood-group.enum';
import { Gender } from '../src/common/enums/gender.enum';
import { UserType } from '../src/common/enums/user-type.enum';
import { AccountModule } from '../src/modules/account/account.module';
import { DoctorProfile } from '../src/modules/account/entities/doctor-profile.entity';
import { PatientProfile } from '../src/modules/account/entities/patient-profile.entity';
import { User } from '../src/modules/account/entities/user.entity';

describe('AccountController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let doctorToken: string;
  let patientToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';

    const db = newDb({ autoCreateForeignKeyIndices: true });
    db.public.registerFunction({
      name: 'version',
      implementation: () => 'PostgreSQL 15.0',
    });
    db.public.registerFunction({
      name: 'current_database',
      implementation: () => 'test',
    });
    let uuidSequence = 0;
    const nextUuid = () => {
      uuidSequence += 1;
      const suffix = uuidSequence.toString(16).padStart(12, '0');
      return `00000000-0000-4000-8000-${suffix}`;
    };
    db.public.registerFunction({
      name: 'gen_random_uuid',
      implementation: nextUuid,
    });
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      implementation: nextUuid,
    });

    dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [User, DoctorProfile, PatientProfile],
      synchronize: true,
    });
    await dataSource.initialize();

    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [authConfig],
        }),
        TypeOrmModule.forRootAsync({
          useFactory: () => dataSource.options,
          dataSourceFactory: async () => dataSource,
        }),
        AccountModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    await app.init();

    const doctorSignup = await request(app.getHttpServer())
      .post('/account/signup')
      .send({
        email: 'doctor@example.com',
        password: 'securePassword1',
        userType: UserType.Doctor,
      });
    doctorToken = doctorSignup.body.accessToken;

    const patientSignup = await request(app.getHttpServer())
      .post('/account/signup')
      .send({
        email: 'patient@example.com',
        password: 'securePassword1',
        userType: UserType.Patient,
      });
    patientToken = patientSignup.body.accessToken;
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('POST /account/signup creates credentials-only doctor account', () => {
    expect(doctorToken).toEqual(expect.any(String));
  });

  it('POST /account/signup creates credentials-only patient account', () => {
    expect(patientToken).toEqual(expect.any(String));
  });

  it('POST /account/login authenticates an existing user', async () => {
    const response = await request(app.getHttpServer())
      .post('/account/login')
      .send({
        email: 'patient@example.com',
        password: 'securePassword1',
      })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.email).toBe('patient@example.com');
  });

  it('GET /account/profile returns user before onboarding', async () => {
    const response = await request(app.getHttpServer())
      .get('/account/profile')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      email: 'patient@example.com',
      userType: UserType.Patient,
      firstName: null,
      lastName: null,
      phone: null,
      gender: null,
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('GET /account/profile rejects requests without a token', () => {
    return request(app.getHttpServer()).get('/account/profile').expect(401);
  });

  it('POST /doctor/profile completes doctor onboarding', async () => {
    const response = await request(app.getHttpServer())
      .post('/doctor/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        firstName: 'Alice',
        lastName: 'Smith',
        specialization: 'Cardiology',
        qualification: 'MBBS, MD (Cardiology)',
        yearsOfExperience: 12,
        consultationFee: 500,
        availability: [
          {
            days: ['monday', 'wednesday', 'friday'],
            startTime: '09:00',
            endTime: '17:00',
          },
        ],
        bio: 'Board-certified cardiologist.',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      firstName: 'Alice',
      lastName: 'Smith',
      doctorProfile: {
        specialization: 'Cardiology',
        qualification: 'MBBS, MD (Cardiology)',
        yearsOfExperience: 12,
        bio: 'Board-certified cardiologist.',
      },
    });
    expect(Number(response.body.doctorProfile.consultationFee)).toBe(500);
    expect(response.body.doctorProfile.availability).toHaveLength(1);
  });

  it('POST /doctor/profile rejects duplicate profile creation', async () => {
    await request(app.getHttpServer())
      .post('/doctor/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        firstName: 'Alice',
        lastName: 'Smith',
        specialization: 'Neurology',
        qualification: 'MBBS',
        yearsOfExperience: 5,
        consultationFee: 400,
        availability: [
          { days: ['tuesday'], startTime: '10:00', endTime: '16:00' },
        ],
      })
      .expect(409);
  });

  it('PATCH /doctor/profile updates doctor profile fields', async () => {
    const response = await request(app.getHttpServer())
      .patch('/doctor/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        consultationFee: 750,
        bio: 'Updated bio.',
      })
      .expect(200);

    expect(response.body.doctorProfile).toMatchObject({
      specialization: 'Cardiology',
      bio: 'Updated bio.',
    });
    expect(Number(response.body.doctorProfile.consultationFee)).toBe(750);
  });

  it('GET /doctor/profile returns doctor data and rejects patients', async () => {
    const doctorResponse = await request(app.getHttpServer())
      .get('/doctor/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);

    expect(doctorResponse.body.userType).toBe(UserType.Doctor);
    expect(doctorResponse.body.firstName).toBe('Alice');
    expect(doctorResponse.body.doctorProfile.specialization).toBe('Cardiology');

    await request(app.getHttpServer())
      .get('/doctor/profile')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(403);
  });

  it('POST /patient/profile completes patient onboarding', async () => {
    const response = await request(app.getHttpServer())
      .post('/patient/profile')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-15',
        gender: Gender.Male,
        phone: '+919876543210',
        bloodGroup: BloodGroup.OPositive,
        allergies: 'Penicillin',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      firstName: 'John',
      lastName: 'Doe',
      phone: '+919876543210',
      gender: Gender.Male,
      dateOfBirth: '1990-01-15',
      patientProfile: {
        bloodGroup: BloodGroup.OPositive,
        allergies: 'Penicillin',
      },
    });
    expect(response.body.age).toEqual(expect.any(Number));
  });

  it('PATCH /patient/profile updates patient profile fields', async () => {
    const response = await request(app.getHttpServer())
      .patch('/patient/profile')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        medicalHistory: 'Hypertension',
        insuranceProvider: 'Star Health',
      })
      .expect(200);

    expect(response.body.patientProfile).toMatchObject({
      bloodGroup: BloodGroup.OPositive,
      medicalHistory: 'Hypertension',
      insuranceProvider: 'Star Health',
    });
  });

  it('GET /patient/profile returns patient data and rejects doctors', async () => {
    const patientResponse = await request(app.getHttpServer())
      .get('/patient/profile')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(patientResponse.body.userType).toBe(UserType.Patient);
    expect(patientResponse.body.firstName).toBe('John');
    expect(patientResponse.body.patientProfile.bloodGroup).toBe(
      BloodGroup.OPositive,
    );

    await request(app.getHttpServer())
      .get('/patient/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(403);
  });
});
