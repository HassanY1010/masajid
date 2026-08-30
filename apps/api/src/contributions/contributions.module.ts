import { Module } from '@nestjs/common';
import { ContributionsService } from './contributions.service';
import {
  ContributionsPublicController,
  ContributionsAdminController,
} from './contributions.controller';

@Module({
  controllers: [ContributionsPublicController, ContributionsAdminController],
  providers: [ContributionsService],
  exports: [ContributionsService],
})
export class ContributionsModule {}
