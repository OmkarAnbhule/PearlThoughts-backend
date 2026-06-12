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

describe('Patient slots (e2e)', () => {
  let app: INestApplication<App>;
  let doctorToken: string;
  let patientToken: string;
  let doctorProfileId: string;

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
        email: 'slots.doctor@example.com',
        password: 'Password123!',
        userType: UserType.Doctor,
      })
      .expect(201);

    const doctorLogin = await request(app.getHttpServer())
      .post('/account/login')
      .send({
        email: 'slots.doctor@example.com',
        password: 'Password123!',
      })
      .expect(200);

    doctorToken = doctorLogin.body.accessToken;

    const doctorProfile = await request(app.getHttpServer())
      .post('/doctor/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        firstName: 'Slot',
        lastName: 'Doctor',
        specialization: 'General Medicine',
        qualification: 'MBBS',
        yearsOfExperience: 5,
        consultationFee: 500,
        availability: [{ day: 'monday', startTime: '10:00', endTime: '11:00' }],
        bio: 'Slot test doctor.',
      })
      .expect(201);

    doctorProfileId = doctorProfile.body.doctorProfile.id;

    await request(app.getHttpServer())
      .post('/account/signup')
      .send({
        email: 'slots.patient@example.com',
        password: 'Password123!',
        userType: UserType.Patient,
      })
      .expect(201);

    const patientLogin = await request(app.getHttpServer())
      .post('/account/login')
      .send({
        email: 'slots.patient@example.com',
        password: 'Password123!',
      })
      .expect(200);

    patientToken = patientLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /doctor/:id/slots generates 15-minute slots from recurring availability', async () => {
    const response = await request(app.getHttpServer())
      .get(`/doctor/${doctorProfileId}/slots`)
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ date: '2026-06-15', duration: 15 })
      .expect(200);

    expect(response.body).toMatchObject({
      date: '2026-06-15',
      durationMinutes: 15,
      availabilityStatus: 'available',
    });
    expect(response.body.slots).toEqual([
      { startTime: '10:00', endTime: '10:15' },
      { startTime: '10:15', endTime: '10:30' },
      { startTime: '10:30', endTime: '10:45' },
      { startTime: '10:45', endTime: '11:00' },
    ]);
  });

  it('GET /doctor/:id/slots prefers custom override availability', async () => {
    await request(app.getHttpServer())
      .post('/doctor/availability/override')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        overrideDate: '2026-06-22',
        overrideType: 'modified',
        startTime: '14:00',
        endTime: '15:00',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/doctor/${doctorProfileId}/slots`)
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ date: '2026-06-22', duration: 30 })
      .expect(200);

    expect(response.body.availabilityStatus).toBe('modified');
    expect(response.body.slots).toEqual([
      { startTime: '14:00', endTime: '14:30' },
      { startTime: '14:30', endTime: '15:00' },
    ]);
  });

  it('GET /doctor/:id/slots hides booked slots', async () => {
    await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorProfileId,
        date: '2026-06-29',
        startTime: '10:00',
        duration: 15,
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/doctor/${doctorProfileId}/slots`)
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ date: '2026-06-29', duration: 15 })
      .expect(200);

    expect(
      response.body.slots.some(
        (slot: { startTime: string }) => slot.startTime === '10:00',
      ),
    ).toBe(false);
  });

  it('GET /doctor/:id/slots returns 404 for unknown doctor', async () => {
    await request(app.getHttpServer())
      .get('/doctor/00000000-0000-4000-8000-000000000099/slots')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ date: '2026-06-15' })
      .expect(404);
  });

  it('GET /doctor/:id/slots returns 400 for past dates', async () => {
    await request(app.getHttpServer())
      .get(`/doctor/${doctorProfileId}/slots`)
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ date: '2020-01-01' })
      .expect(400);
  });

  it('GET /doctor/:id/slots returns 400 for invalid duration', async () => {
    await request(app.getHttpServer())
      .get(`/doctor/${doctorProfileId}/slots`)
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ date: '2026-06-15', duration: 20 })
      .expect(400);
  });
});
