import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { ContributionsModule } from './contributions/contributions.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { UploadsModule } from './uploads/uploads.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './common/audit/audit.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    ProjectsModule,
    ContributionsModule,
    BankAccountsModule,
    UploadsModule,
    DashboardModule,
    HealthModule,
  ],
})
export class AppModule {}
