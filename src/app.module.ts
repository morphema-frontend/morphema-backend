import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HorecaVenuesModule } from './horeca-venues/horeca-venues.module';
import { GigsModule } from './gigs/gigs.module';
import { BookingsModule } from './bookings/bookings.module';
import { JobTypesModule } from './job-types/job-types.module';
import { InsuranceModule } from './insurance/insurance.module';
import { SkillsModule } from './skills/skills.module';
import { ContractsModule } from './contracts/contracts.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { OnboardingController } from './onboarding/onboarding.controller';

import { CreateAuditEventsAndGigPaymentSnapshot1700000000000 } from './migrations/1700000000000-CreateAuditEventsAndGigPaymentSnapshot';

const databaseUrl = process.env.DATABASE_URL;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(databaseUrl
        ? { url: databaseUrl }
        : {
            // Support both legacy DB_* and DATABASE_* envs (no secrets in repo).
            host: process.env.DATABASE_HOST ?? process.env.DB_HOST ?? 'localhost',
            port: Number(process.env.DATABASE_PORT ?? process.env.DB_PORT ?? 5432),
            username: process.env.DATABASE_USER ?? process.env.DB_USER ?? 'postgres',
            password: process.env.DATABASE_PASSWORD ?? process.env.DB_PASSWORD ?? 'morphemapwd',
            database: process.env.DATABASE_NAME ?? process.env.DB_NAME ?? 'morphema',
          }),
      autoLoadEntities: true,
      synchronize: false,

      // DEMO SAFE: only additive migrations (CREATE/ALTER IF NOT EXISTS)
      migrationsRun: true,
      migrations: [CreateAuditEventsAndGigPaymentSnapshot1700000000000],
    }),
    UsersModule,
    AuthModule,
    HorecaVenuesModule,
    GigsModule,
    BookingsModule,
    JobTypesModule,
    InsuranceModule,
    SkillsModule,
    ContractsModule,
    AuditModule,
    AdminModule,
  ],
  controllers: [AppController, OnboardingController],
  providers: [AppService],
})
export class AppModule {}
