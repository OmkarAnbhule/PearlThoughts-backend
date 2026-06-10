import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { registerAs } from '@nestjs/config';

export function parseCommaSeparatedHosts(
  value: string | undefined,
): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default registerAs('cors', () => ({
  allowedHosts: parseCommaSeparatedHosts(process.env.CORS_ALLOWED_HOSTS),
  credentials: process.env.CORS_CREDENTIALS === 'true',
}));

export function setupCors(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const allowedHosts = configService.get<string[]>('cors.allowedHosts', []);

  if (allowedHosts.length === 0) {
    return;
  }

  const credentials = configService.get<boolean>('cors.credentials', false);

  app.enableCors({
    origin: allowedHosts,
    credentials,
  });
}
