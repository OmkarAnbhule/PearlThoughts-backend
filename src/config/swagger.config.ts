import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Matches the version bundled with @nestjs/swagger. */
const SWAGGER_UI_VERSION = '5.32.6';
const SWAGGER_CDN = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}`;

function isVercel(): boolean {
  return process.env.VERCEL === '1';
}

function isSwaggerEnabled(): boolean {
  if (process.env.ENABLE_SWAGGER === 'false') {
    return false;
  }
  return true;
}

function useSwaggerCdn(): boolean {
  if (process.env.SWAGGER_USE_CDN === 'false') {
    return false;
  }
  if (process.env.SWAGGER_USE_CDN === 'true') {
    return true;
  }
  // Vercel bundles omit node_modules static assets; CDN is required there.
  return process.env.NODE_ENV === 'production' || isVercel();
}

function resolveSwaggerPath(): string {
  const configured = process.env.SWAGGER_PATH?.trim();
  if (configured) {
    return configured;
  }
  // Avoid Vercel's reserved /api convention and common frontend /api proxy rules.
  return isVercel() ? 'docs' : 'api';
}

export function setupSwagger(app: INestApplication): void {
  if (!isSwaggerEnabled()) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Hospital Management System')
    .setDescription('Hospital management system')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT access token',
      },
      'access-token',
    )
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  const path = resolveSwaggerPath();

  SwaggerModule.setup(path, app, documentFactory, {
    customSiteTitle: 'Hospital Management System API',
    ...(useSwaggerCdn()
      ? {
          customCssUrl: [`${SWAGGER_CDN}/swagger-ui.css`],
          customJs: [
            `${SWAGGER_CDN}/swagger-ui-bundle.js`,
            `${SWAGGER_CDN}/swagger-ui-standalone-preset.js`,
          ],
          customfavIcon: `${SWAGGER_CDN}/favicon-32x32.png`,
        }
      : {}),
  });
}
