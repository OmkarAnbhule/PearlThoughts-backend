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
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('POST /account/signup creates a doctor with profile data', async () => {
    const response = await request(app.getHttpServer())
      .post('/account/signup')
      .send({
        email: 'doctor@example.com',
        password: 'securePassword1',
        userType: UserType.Doctor,
        firstName: 'Alice',
        lastName: 'Smith',
        doctorProfile: {
          licenseNumber: 'MED-12345',
          specialization: 'Cardiology',
          yearsOfExperience: 12,
        },
      })
      .expect(201);

    expect(response.body.user.userType).toBe(UserType.Doctor);

    const profileResponse = await request(app.getHttpServer())
      .get('/account/profile')
      .set('Authorization', `Bearer ${response.body.accessToken}`)
      .expect(200);

    expect(profileResponse.body.doctorProfile).toMatchObject({
      licenseNumber: 'MED-12345',
      specialization: 'Cardiology',
      yearsOfExperience: 12,
    });
  });

  it('POST /account/signup creates a patient and returns a token', async () => {
    const response = await request(app.getHttpServer())
      .post('/account/signup')
      .send({
        email: 'patient@example.com',
        password: 'securePassword1',
        userType: UserType.Patient,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+919876543210',
        dateOfBirth: '1990-01-15',
        gender: Gender.Male,
        patientProfile: {
          bloodGroup: BloodGroup.OPositive,
          emergencyContactName: 'Jane Doe',
        },
      })
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: 'patient@example.com',
      userType: UserType.Patient,
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(response.body.user.id).toEqual(expect.any(String));
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

  it('GET /account/profile returns the authenticated patient profile', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/account/login')
      .send({
        email: 'patient@example.com',
        password: 'securePassword1',
      })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/account/profile')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      email: 'patient@example.com',
      userType: UserType.Patient,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+919876543210',
      gender: Gender.Male,
    });
    expect(response.body.patientProfile).toMatchObject({
      bloodGroup: BloodGroup.OPositive,
      emergencyContactName: 'Jane Doe',
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('GET /account/profile rejects requests without a token', () => {
    return request(app.getHttpServer()).get('/account/profile').expect(401);
  });
});
