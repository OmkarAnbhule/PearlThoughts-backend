import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { getDatabaseEnv } from '../config/database.util';

config();

const db = getDatabaseEnv();

export default new DataSource({
  type: 'postgres',
  host: db.host,
  port: db.port,
  username: db.username,
  password: db.password,
  database: db.database,
  ssl: db.ssl ? { rejectUnauthorized: false } : false,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
