import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ContributionsService } from './contributions.service';
import { CreateContributionDto, RejectContributionDto } from './dto/contribution.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ContributionStatus } from '@masajid/shared-types';
import { CloudStorageService } from '../uploads/cloud-storage.service';

const receiptStorageConfig = {
  storage: diskStorage({
    destination: './uploads/receipts',
    filename: (req, file, cb) => {
      const uniqueSuffix = `${uuidv4()}${extname(file.originalname).toLowerCase()}`;
      cb(null, `receipt-${uniqueSuffix}`);
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('صيغة الملف غير مدعومة. يسمح بـ JPG, PNG, WEBP, PDF فقط'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};

import { Throttle } from '@nestjs/throttler';

@ApiTags('Contributions (Public)')
@Controller('contributions')
export class ContributionsPublicController {
  constructor(
    private readonly contributionsService: ContributionsService,
    private readonly cloudStorage: CloudStorageService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // SEC-001: 10 contributions per minute max per IP
  @ApiOperation({ summary: 'إرسال مساهمة جديدة مع سند التحويل (صورة أو PDF)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('receipt', receiptStorageConfig))
  async createContribution(
    @Body() dto: CreateContributionDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Parse numeric value if form-data sends it as string
    const normalizedDto = {
      ...dto,
      amount: Number(dto.amount),
    };

    let receiptFile: { url: string; storageKey: string } | undefined;

    if (file) {
      receiptFile = await this.cloudStorage.uploadFile(file, 'receipts');
    }

    return this.contributionsService.createContribution(normalizedDto, receiptFile);
  }
}

@ApiTags('Admin Contributions')
@Controller('admin/contributions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContributionsAdminController {
  constructor(private readonly contributionsService: ContributionsService) {}

  @Get()
  @ApiOperation({ summary: 'لوحة التحكم: استعراض المساهمات مع الفلترة' })
  @ApiQuery({ name: 'status', enum: ContributionStatus, required: false })
  @ApiQuery({ name: 'projectId', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getAdminContributions(
    @Query('status') status?: ContributionStatus,
    @Query('projectId') projectId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.contributionsService.getAdminContributions({
      status,
      projectId,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'لوحة التحكم: تفاصيل مساهمة محددة' })
  async getContributionById(@Param('id') id: string) {
    return this.contributionsService.getContributionById(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'لوحة التحكم: قبول مساهمة واحتساب أسهمها أوتوماتيكياً' })
  async approveContribution(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.contributionsService.approveContribution(id, user.id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'لوحة التحكم: رفض مساهمة مع ذكر السبب' })
  async rejectContribution(
    @Param('id') id: string,
    @Body() dto: RejectContributionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.contributionsService.rejectContribution(id, dto, user.id);
  }
}
