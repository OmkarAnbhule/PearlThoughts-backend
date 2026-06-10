import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getDatabaseEnv } from './database.util';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const db = getDatabaseEnv();
  const isServerless = process.env.VERCEL === '1';

  return {
    type: 'postgres',
    host: db.host,
    port: db.port,
    username: db.username,
    password: db.password,
    database: db.database,
    ssl: db.ssl ? { rejectUnauthorized: false } : false,
    autoLoadEntities: true,
    synchronize: false,
    migrations: [`${__dirname}/../database/migrations/*.{ts,js}`],
    migrationsRun:
      process.env.NODE_ENV === 'production' && !isServerless,
    retryAttempts: isServerless ? 1 : 10,
    retryDelay: 3000,
    extra: {
      max: Number(process.env.DATABASE_POOL_MAX ?? (isServerless ? 1 : 10)),
    },
  };
});
