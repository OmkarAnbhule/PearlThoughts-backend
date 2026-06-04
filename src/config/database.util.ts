export interface DatabaseEnv {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

const REQUIRED_KEYS = [
  'DB_HOST',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
] as const;

export function getMissingDatabaseEnvKeys(): string[] {
  return REQUIRED_KEYS.filter((key) => !process.env[key]?.trim());
}

export function getDatabaseEnv(): DatabaseEnv {
  const missing = getMissingDatabaseEnvKeys();
  if (missing.length > 0) {
    throw new Error(
      `Missing database env: ${missing.join(', ')}. Copy .env.example to .env and fill in your Supabase credentials.`,
    );
  }

  console.log(
    `Using database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}/${process.env.DB_USERNAME}/${process.env.DB_PASSWORD}`,
  );

  return {
    host: process.env.DB_HOST.trim(),
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME.trim(),
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME.trim(),
    ssl: process.env.DB_SSL !== 'false',
  };
}

/** Builds a PostgreSQL connection URL (e.g. for logging or external tools). */
export function buildDatabaseUrl(env: DatabaseEnv = getDatabaseEnv()): string {
  const user = encodeURIComponent(env.username);
  const password = encodeURIComponent(env.password);
  return `postgresql://${user}:${password}@${env.host}:${env.port}/${env.database}`;
}
