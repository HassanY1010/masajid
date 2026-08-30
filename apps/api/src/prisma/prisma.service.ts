import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('📦 Connected to PostgreSQL database successfully.');
    } catch (error) {
      this.logger.warn('⚠️ Could not connect to PostgreSQL immediately. Check DATABASE_URL if running offline.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
