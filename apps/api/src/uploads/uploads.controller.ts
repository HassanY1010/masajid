import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CloudStorageService } from './cloud-storage.service';

const mediaStorageConfig = {
  storage: diskStorage({
    destination: './uploads/media',
    filename: (req, file, cb) => {
      const uniqueSuffix = `${uuidv4()}${extname(file.originalname).toLowerCase()}`;
      cb(null, `media-${uniqueSuffix}`);
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('صيغة الملف غير مدعومة. يسمح بـ JPG, PNG, WEBP فقط'), false);
    }
  },
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
  },
};

@ApiTags('Admin Uploads')
@Controller('admin/uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private readonly cloudStorage: CloudStorageService) {}

  @Post('image')
  @ApiOperation({ summary: 'لوحة التحكم: رفع صورة للمشروع' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', mediaStorageConfig))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('لم يتم اختيار ملف');
    }

    const res = await this.cloudStorage.uploadFile(file, 'media');

    return {
      url: res.url,
      storageKey: res.storageKey,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post('images')
  @ApiOperation({ summary: 'لوحة التحكم: رفع عدة صور دفعة واحدة' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, mediaStorageConfig))
  async uploadMultipleImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('لم يتم اختيار ملفات');
    }

    return Promise.all(
      files.map(async (file) => {
        const res = await this.cloudStorage.uploadFile(file, 'media');
        return {
          url: res.url,
          storageKey: res.storageKey,
          originalName: file.originalname,
          size: file.size,
        };
      }),
    );
  }
}
