import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getDatabaseEnv } from './database.util';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const db = getDatabaseEnv();

  return {
    type: 'postgres',
    host: db.host,
    port: db.port,
    username: db.username,
    password: db.password,
    database: db.database,
    ssl: db.ssl ? { rejectUnauthorized: false } : false,
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV !== 'production',
    extra: {
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    },
  };
});
