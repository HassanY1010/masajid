import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  CreateProjectUpdateDto,
} from './dto/project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ProjectCategory, ProjectStatus } from '@masajid/shared-types';

@ApiTags('Projects (Public)')
@Controller('projects')
export class ProjectsPublicController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'استعراض المشاريع المنشورة للزوار مع الفلترة والبحث' })
  @ApiQuery({ name: 'category', enum: ProjectCategory, required: false })
  @ApiQuery({ name: 'governorate', type: String, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getPublicProjects(
    @Query('category') category?: ProjectCategory,
    @Query('governorate') governorate?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.projectsService.getPublicProjects({
      category,
      governorate,
      search,
      page,
      limit,
    });
  }

  @Get('categories')
  @ApiOperation({ summary: 'قائمة فئات مشاريع واحتياجات المساجد المعتمدة' })
  async getCategories() {
    return Object.values(ProjectCategory);
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل مشروع مسجد محدد للزوار' })
  async getPublicProjectById(@Param('id') id: string) {
    return this.projectsService.getPublicProjectById(id);
  }
}

@ApiTags('Admin Projects')
@Controller('admin/projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsAdminController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'لوحة التحكم: جلب جميع المشاريع بجميع الحالات' })
  @ApiQuery({ name: 'status', enum: ProjectStatus, required: false })
  @ApiQuery({ name: 'category', enum: ProjectCategory, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getAdminProjects(
    @Query('status') status?: ProjectStatus,
    @Query('category') category?: ProjectCategory,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.projectsService.getAdminProjects({
      status,
      category,
      search,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'لوحة التحكم: جلب تفاصيل مشروع للتعديل' })
  async getAdminProjectById(@Param('id') id: string) {
    return this.projectsService.getAdminProjectById(id);
  }

  @Post()
  @ApiOperation({ summary: 'لوحة التحكم: إضافة مشروع مسجد جديد' })
  async createProject(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.projectsService.createProject(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'لوحة التحكم: تعديل مشروع' })
  async updateProject(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.projectsService.updateProject(id, dto, user.id);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'لوحة التحكم: نشر أو إلغاء نشر المشروع' })
  async setPublishStatus(
    @Param('id') id: string,
    @Body('isPublished') isPublished: boolean,
    @CurrentUser() user: { id: string },
  ) {
    return this.projectsService.setPublishStatus(id, isPublished, user.id);
  }

  @Post(':id/updates')
  @ApiOperation({ summary: 'لوحة التحكم: إضافة تحديث إنجاز للمشروع' })
  async addUpdate(
    @Param('id') id: string,
    @Body() dto: CreateProjectUpdateDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.projectsService.addProjectUpdate(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'لوحة التحكم: حذف أو أرشفة مشروع' })
  async deleteProject(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.projectsService.deleteProject(id, user.id);
  }
}
