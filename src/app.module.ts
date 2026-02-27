import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    DatabaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        url: configService.get<string>(
          'DATABSE_URL',
          'postgresql://user:password@localhost:5432/todo_db',
        ),
      }),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
