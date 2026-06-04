import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from '../config/database.config';
import { getMissingDatabaseEnvKeys } from '../config/database.util';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    if (process.env.SKIP_DATABASE === 'true') {
      return { module: DatabaseModule };
    }

    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
            const missing = getMissingDatabaseEnvKeys();
            if (missing.length > 0) {
              throw new Error(
                `Missing database env: ${missing.join(', ')}. Copy .env.example to .env and fill in your Supabase credentials.`,
              );
            }
            return configService.getOrThrow<TypeOrmModuleOptions>('database');
          },
        }),
      ],
    };
  }
}

export const databaseConfigModule = ConfigModule.forFeature(databaseConfig);
