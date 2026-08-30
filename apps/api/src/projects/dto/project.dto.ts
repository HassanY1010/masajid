import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectCategory, ProjectStatus, ProjectImageType } from '@masajid/shared-types';

export class CreateProjectImageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  storageKey: string;

  @ApiProperty({ enum: ProjectImageType, default: ProjectImageType.GALLERY })
  @IsEnum(ProjectImageType)
  type: ProjectImageType;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateProjectDto {
  @ApiProperty({ description: 'عنوان المشروع', example: 'تركيب منظومة طاقة شمسية' })
  @IsString({ message: 'عنوان المشروع يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'عنوان المشروع مطلوب' })
  title: string;

  @ApiProperty({ description: 'اسم المسجد', example: 'مسجد التقوى' })
  @IsString({ message: 'اسم المسجد يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم المسجد مطلوب' })
  mosqueName: string;

  @ApiProperty({ description: 'المحافظة', example: 'حضرموت' })
  @IsString()
  @IsNotEmpty({ message: 'المحافظة مطلوبة' })
  governorate: string;

  @ApiProperty({ description: 'المديرية', example: 'غيل باوزير' })
  @IsString()
  @IsNotEmpty({ message: 'المديرية مطلوبة' })
  district: string;

  @ApiProperty({ description: 'وصف تفصيلي للموقع', example: 'حي السلام - بجوار المدرسة' })
  @IsString()
  @IsNotEmpty({ message: 'وصف الموقع مطلوب' })
  locationText: string;

  @ApiPropertyOptional({ description: 'خط العرض', example: 14.7785 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'خط الطول', example: 49.3683 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'وصف المشروع العام' })
  @IsString()
  @IsNotEmpty({ message: 'وصف المشروع مطلوب' })
  description: string;

  @ApiProperty({ description: 'وصف تفصيلي للاحتياج الفني' })
  @IsString()
  @IsNotEmpty({ message: 'وصف الاحتياج مطلوب' })
  needDescription: string;

  @ApiProperty({ enum: ProjectCategory, default: ProjectCategory.MAINTENANCE })
  @IsEnum(ProjectCategory, { message: 'فئة المشروع غير صالحة' })
  category: ProjectCategory;

  @ApiProperty({ description: 'التكلفة الإجمالية التقديرية', example: 20000 })
  @IsNumber()
  @IsPositive({ message: 'التكلفة المقدرة يجب أن تكون قيمة موجبة' })
  estimatedCost: number;

  @ApiProperty({ description: 'العملة', default: 'SAR' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'إجمالي عدد الأسهم', example: 2000 })
  @IsInt({ message: 'عدد الأسهم يجب أن يكون عدداً صحيحاً' })
  @IsPositive({ message: 'عدد الأسهم يجب أن يكون أكبر من صفر' })
  totalShares: number;

  @ApiProperty({ description: 'قيمة السهم الواحد', example: 10 })
  @IsNumber()
  @IsPositive({ message: 'قيمة السهم يجب أن تكون قيمة موجبة' })
  shareValue: number;

  @ApiPropertyOptional({ type: [CreateProjectImageDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectImageDto)
  images?: CreateProjectImageDto[];
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mosqueName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  governorate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  needDescription?: string;

  @ApiPropertyOptional({ enum: ProjectCategory })
  @IsOptional()
  @IsEnum(ProjectCategory)
  category?: ProjectCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  totalShares?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  shareValue?: number;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ type: [CreateProjectImageDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectImageDto)
  images?: CreateProjectImageDto[];
}

export class CreateProjectUpdateDto {
  @ApiProperty({ description: 'عنوان التحديث', example: 'تم تركيب الألواح بنجاح' })
  @IsString()
  @IsNotEmpty({ message: 'عنوان التحديث مطلوب' })
  title: string;

  @ApiProperty({ description: 'تفاصيل التحديث' })
  @IsString()
  @IsNotEmpty({ message: 'تفاصيل التحديث مطلوبة' })
  description: string;

  @ApiPropertyOptional({ type: [String], description: 'روابط صور التحديث والإنجاز' })
  @IsOptional()
  @IsString({ each: true })
  images?: string[];
}
