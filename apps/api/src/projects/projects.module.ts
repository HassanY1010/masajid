import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import {
  ProjectsPublicController,
  ProjectsAdminController,
} from './projects.controller';

@Module({
  controllers: [ProjectsPublicController, ProjectsAdminController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
