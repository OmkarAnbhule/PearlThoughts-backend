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
import { DoctorAvailabilityStatus } from '../src/common/enums/doctor-availability-status.enum';
import { UserType } from '../src/common/enums/user-type.enum';
import { AccountModule } from '../src/modules/account/account.module';
import { DoctorProfile } from '../src/modules/account/entities/doctor-profile.entity';
import { PatientProfile } from '../src/modules/account/entities/patient-profile.entity';
import { User } from '../src/modules/account/entities/user.entity';

const ALL_DAY_AVAILABILITY = [
  {
    days: [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ],
    startTime: '00:00',
    endTime: '23:59',
  },
];

describe('DoctorDiscoveryController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let patientToken: string;
  let doctorToken: string;
  let cardiologistId: string;
  let neurologistId: string;

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

    const patientSignup = await request(app.getHttpServer())
      .post('/account/signup')
      .send({
        email: 'patient@example.com',
        password: 'securePassword1',
        userType: UserType.Patient,
      });
    patientToken = patientSignup.body.accessToken;

    const cardiologistSignup = await request(app.getHttpServer())
      .post('/account/signup')
      .send({
        email: 'alice@example.com',
        password: 'securePassword1',
        userType: UserType.Doctor,
      });
    doctorToken = cardiologistSignup.body.accessToken;

    await request(app.getHttpServer())
      .post('/doctor/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        firstName: 'Alice',
        lastName: 'Smith',
        specialization: 'Cardiology',
        qualification: 'MBBS, MD (Cardiology)',
        yearsOfExperience: 12,
        consultationFee: 750,
        availability: ALL_DAY_AVAILABILITY,
        bio: 'Board-certified cardiologist.',
      });

    const neurologistSignup = await request(app.getHttpServer())
      .post('/account/signup')
      .send({
        email: 'rahul@example.com',
        password: 'securePassword1',
        userType: UserType.Doctor,
      });
    const neurologistToken = neurologistSignup.body.accessToken;

    await request(app.getHttpServer())
      .post('/doctor/profile')
      .set('Authorization', `Bearer ${neurologistToken}`)
      .send({
        firstName: 'Rahul',
        lastName: 'Verma',
        specialization: 'Neurology',
        qualification: 'MBBS, DM (Neurology)',
        yearsOfExperience: 8,
        consultationFee: 600,
        availability: ALL_DAY_AVAILABILITY,
      });

    const listResponse = await request(app.getHttpServer())
      .get('/doctor')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    cardiologistId = listResponse.body.data.find(
      (doctor: { fullName: string }) => doctor.fullName === 'Alice Smith',
    ).id;
    neurologistId = listResponse.body.data.find(
      (doctor: { fullName: string }) => doctor.fullName === 'Rahul Verma',
    ).id;
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('GET /doctor lists onboarded doctors with default pagination', async () => {
    const response = await request(app.getHttpServer())
      .get('/doctor')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    });
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toMatchObject({
      id: expect.any(String),
      fullName: expect.any(String),
      specialization: expect.any(String),
      experience: expect.any(Number),
      consultationFee: expect.any(String),
      availabilityStatus: expect.stringMatching(/available|unavailable/),
    });
  });

  it('GET /doctor supports pagination query params', async () => {
    const pageOne = await request(app.getHttpServer())
      .get('/doctor')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ page: 1, limit: 1 })
      .expect(200);

    expect(pageOne.body).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
    expect(pageOne.body.data).toHaveLength(1);

    const pageTwo = await request(app.getHttpServer())
      .get('/doctor')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ page: 2, limit: 1 })
      .expect(200);

    expect(pageTwo.body.data).toHaveLength(1);
    expect(pageTwo.body.data[0].id).not.toBe(pageOne.body.data[0].id);
  });

  it('GET /doctor filters doctors by specialization', async () => {
    const response = await request(app.getHttpServer())
      .get('/doctor')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ specialization: 'cardiologist' })
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: cardiologistId,
      specialization: 'Cardiology',
    });
  });

  it('GET /doctor searches doctors by name', async () => {
    const response = await request(app.getHttpServer())
      .get('/doctor')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ search: 'rahul' })
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: neurologistId,
      fullName: 'Rahul Verma',
    });
  });

  it('GET /doctor filters currently available doctors', async () => {
    const response = await request(app.getHttpServer())
      .get('/doctor')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ availability: true })
      .expect(200);

    expect(response.body.total).toBeGreaterThanOrEqual(1);
    expect(
      response.body.data.every(
        (doctor: { availabilityStatus: string }) =>
          doctor.availabilityStatus === DoctorAvailabilityStatus.Available,
      ),
    ).toBe(true);
  });

  it('GET /doctor returns empty results when no doctors match', async () => {
    const response = await request(app.getHttpServer())
      .get('/doctor')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ search: 'unknown-doctor' })
      .expect(200);

    expect(response.body).toMatchObject({
      data: [],
      total: 0,
      totalPages: 0,
    });
  });

  it('GET /doctor rejects unauthenticated requests and doctors', async () => {
    await request(app.getHttpServer()).get('/doctor').expect(401);

    await request(app.getHttpServer())
      .get('/doctor')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(403);
  });

  it('GET /doctor rejects invalid pagination and filter values', async () => {
    await request(app.getHttpServer())
      .get('/doctor')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ page: 0 })
      .expect(400);

    await request(app.getHttpServer())
      .get('/doctor')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ limit: -1 })
      .expect(400);

    await request(app.getHttpServer())
      .get('/doctor')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ specialization: '@@' })
      .expect(400);

    await request(app.getHttpServer())
      .get('/doctor')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ availability: 'maybe' })
      .expect(400);
  });

  it('GET /doctor/:id returns doctor profile details', async () => {
    const response = await request(app.getHttpServer())
      .get(`/doctor/${cardiologistId}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: cardiologistId,
      fullName: 'Alice Smith',
      specialization: 'Cardiology',
      qualification: 'MBBS, MD (Cardiology)',
      experience: 12,
      bio: 'Board-certified cardiologist.',
      availabilityStatus: expect.stringMatching(/available|unavailable/),
    });
    expect(Number(response.body.consultationFee)).toBe(750);
    expect(response.body.availability).toHaveLength(1);
  });

  it('GET /doctor/:id returns 404 for unknown doctor', async () => {
    await request(app.getHttpServer())
      .get('/doctor/00000000-0000-4000-8000-000000000099')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(404);
  });

  it('GET /doctor/:id returns 400 for invalid doctor ID', async () => {
    await request(app.getHttpServer())
      .get('/doctor/not-a-uuid')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(400);
  });
});
