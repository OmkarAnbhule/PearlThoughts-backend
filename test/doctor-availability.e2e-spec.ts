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
import { Appointment } from '../src/modules/account/entities/appointment.entity';
import { DoctorAvailabilityOverride } from '../src/modules/account/entities/doctor-availability-override.entity';
import { DoctorProfile } from '../src/modules/account/entities/doctor-profile.entity';
import { DoctorRecurringAvailability } from '../src/modules/account/entities/doctor-recurring-availability.entity';
import { PatientProfile } from '../src/modules/account/entities/patient-profile.entity';
import { User } from '../src/modules/account/entities/user.entity';

describe('Doctor availability (e2e)', () => {
  let app: INestApplication<App>;
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

    const dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [
        User,
        DoctorProfile,
        PatientProfile,
        DoctorRecurringAvailability,
        DoctorAvailabilityOverride,
        Appointment,
      ],
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

    await request(app.getHttpServer())
      .post('/account/signup')
      .send({
        email: 'doctor.availability@example.com',
        password: 'Password123!',
        userType: UserType.Doctor,
      })
      .expect(201);

    const doctorLogin = await request(app.getHttpServer())
      .post('/account/login')
      .send({
        email: 'doctor.availability@example.com',
        password: 'Password123!',
      })
      .expect(200);

    doctorToken = doctorLogin.body.accessToken;

    await request(app.getHttpServer())
      .post('/doctor/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        firstName: 'Schedule',
        lastName: 'Doctor',
        specialization: 'General Medicine',
        qualification: 'MBBS',
        yearsOfExperience: 5,
        consultationFee: 500,
        availability: [{ day: 'monday', startTime: '09:00', endTime: '12:00' }],
        bio: 'Availability test doctor.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/account/signup')
      .send({
        email: 'patient.availability@example.com',
        password: 'Password123!',
        userType: UserType.Patient,
      })
      .expect(201);

    const patientLogin = await request(app.getHttpServer())
      .post('/account/login')
      .send({
        email: 'patient.availability@example.com',
        password: 'Password123!',
      })
      .expect(200);

    patientToken = patientLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /doctor/availability creates multiple windows on the same day', async () => {
    const response = await request(app.getHttpServer())
      .post('/doctor/availability')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ day: 'monday', startTime: '14:00', endTime: '17:00' })
      .expect(201);

    expect(response.body).toMatchObject({
      day: 'monday',
      startTime: '14:00',
      endTime: '17:00',
    });
    expect(response.body.id).toBeDefined();
  });

  it('GET /doctor/availability lists recurring windows', async () => {
    const response = await request(app.getHttpServer())
      .get('/doctor/availability')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body.every((entry: { id: string }) => entry.id)).toBe(true);
  });

  it('POST /doctor/availability rejects overlapping windows', async () => {
    await request(app.getHttpServer())
      .post('/doctor/availability')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ day: 'monday', startTime: '11:00', endTime: '13:00' })
      .expect(400);
  });

  it('POST /doctor/availability rejects invalid time ranges', async () => {
    await request(app.getHttpServer())
      .post('/doctor/availability')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ day: 'tuesday', startTime: '15:00', endTime: '13:00' })
      .expect(400);
  });

  it('POST /doctor/availability/override replaces recurring availability for a date', async () => {
    await request(app.getHttpServer())
      .post('/doctor/availability/override')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        overrideDate: '2026-06-15',
        overrideType: 'modified',
        startTime: '14:00',
        endTime: '15:00',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/doctor/availability/date')
      .set('Authorization', `Bearer ${doctorToken}`)
      .query({ date: '2026-06-15' })
      .expect(200);

    expect(response.body).toMatchObject({
      date: '2026-06-15',
      day: 'monday',
      status: 'modified',
      slots: [{ startTime: '14:00', endTime: '15:00' }],
    });
  });

  it('PATCH /doctor/availability/:id updates a window', async () => {
    const list = await request(app.getHttpServer())
      .get('/doctor/availability')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);

    const target = list.body.find(
      (entry: { startTime: string }) => entry.startTime === '14:00',
    );

    const response = await request(app.getHttpServer())
      .patch(`/doctor/availability/${target.id}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ startTime: '15:00', endTime: '18:00' })
      .expect(200);

    expect(response.body).toMatchObject({
      id: target.id,
      startTime: '15:00',
      endTime: '18:00',
    });
  });

  it('rejects patient access to doctor availability APIs', async () => {
    await request(app.getHttpServer())
      .get('/doctor/availability')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(403);
  });
});
