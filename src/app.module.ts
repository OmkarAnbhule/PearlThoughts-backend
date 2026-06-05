import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger';
import databaseConfig from './config/database.config';
import { DatabaseModule, databaseConfigModule } from './database/database.module';
import { AccountPersistenceModule } from './modules/account/account-persistence.module';

const databaseEnabled = process.env.SKIP_DATABASE !== 'true';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    databaseConfigModule,
    DatabaseModule.forRoot(),
    ...(databaseEnabled ? [AccountPersistenceModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
