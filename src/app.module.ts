import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import { DatabaseModule, databaseConfigModule } from './database/database.module';
import { AccountModule } from './modules/account/account.module';

const databaseEnabled = process.env.SKIP_DATABASE !== 'true';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [authConfig],
    }),
    databaseConfigModule,
    DatabaseModule.forRoot(),
    ...(databaseEnabled ? [AccountModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
