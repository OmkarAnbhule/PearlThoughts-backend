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
import { UserType } from '../src/common/enums/user-type.enum';
import { AccountModule } from '../src/modules/account/account.module';
import { DoctorProfile } from '../src/modules/account/entities/doctor-profile.entity';
import { PatientProfile } from '../src/modules/account/entities/patient-profile.entity';
import { User } from '../src/modules/account/entities/user.entity';

describe('Role-based auth (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let doctorToken: string;
  let patientToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.BCRYPT_SALT_ROUNDS = '4';

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
        firstName: 'Lavangi',
        lastName: 'Sharma',
      });
    doctorToken = doctorSignup.body.accessToken;

    const patientSignup = await request(app.getHttpServer())
      .post('/account/signup')
      .send({
        email: 'patient@example.com',
        password: 'securePassword1',
        userType: UserType.Patient,
        firstName: 'John',
        lastName: 'Doe',
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

  it('POST /account/signup accepts minimal doctor registration', async () => {
    const response = await request(app.getHttpServer())
      .post('/account/signup')
      .send({
        email: 'doctor2@example.com',
        password: 'securePassword1',
        userType: UserType.Doctor,
        firstName: 'Alice',
        lastName: 'Smith',
      })
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.userType).toBe(UserType.Doctor);
  });

  it(
    'POST /account/login authenticates an existing user',
    async () => {
      const response = await request(app.getHttpServer())
        .post('/account/login')
        .send({
          email: 'patient@example.com',
          password: 'securePassword1',
        })
        .expect(200);

      expect(response.body.user.email).toBe('patient@example.com');
    },
    15000,
  );

  it('GET /doctor/profile allows doctors', async () => {
    const response = await request(app.getHttpServer())
      .get('/doctor/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      email: 'doctor@example.com',
      firstName: 'Lavangi',
      lastName: 'Sharma',
      displayName: 'Dr. Lavangi',
    });
    expect(response.body).toHaveProperty('specialization');
    expect(response.body).toHaveProperty('services');
    expect(response.body).toHaveProperty('availability');
  });

  it('GET /doctor/profile rejects patients with 403', () => {
    return request(app.getHttpServer())
      .get('/doctor/profile')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(403);
  });

  it('GET /patient/profile allows patients', async () => {
    const response = await request(app.getHttpServer())
      .get('/patient/profile')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      email: 'patient@example.com',
      firstName: 'John',
      lastName: 'Doe',
    });
  });

  it('GET /patient/profile rejects doctors with 403', () => {
    return request(app.getHttpServer())
      .get('/patient/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(403);
  });

  it('GET /doctor/profile rejects unauthenticated requests', () => {
    return request(app.getHttpServer()).get('/doctor/profile').expect(401);
  });
});
