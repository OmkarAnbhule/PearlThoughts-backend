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
  const host = process.env.DB_HOST?.trim();
  const username = process.env.DB_USERNAME?.trim();
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME?.trim();

  if (!host || !username || !password?.trim() || !database) {
    const missing = getMissingDatabaseEnvKeys();
    throw new Error(
      `Missing database env: ${missing.join(', ')}. Copy .env.example to .env and fill in your Supabase credentials.`,
    );
  }

  return {
    host,
    port: Number(process.env.DB_PORT ?? 5432),
    username,
    password,
    database,
    ssl: process.env.DB_SSL !== 'false',
  };
}

/** Builds a PostgreSQL connection URL (e.g. for logging or external tools). */
export function buildDatabaseUrl(env: DatabaseEnv = getDatabaseEnv()): string {
  const user = encodeURIComponent(env.username);
  const password = encodeURIComponent(env.password);
  return `postgresql://${user}:${password}@${env.host}:${env.port}/${env.database}`;
}
