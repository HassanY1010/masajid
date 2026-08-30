import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContributionStatus } from '@masajid/shared-types';

export class CreateContributionDto {
  @ApiProperty({ description: 'معرف المشروع' })
  @IsUUID('4', { message: 'معرف المشروع غير صحيح' })
  @IsNotEmpty({ message: 'معرف المشروع مطلوب' })
  projectId: string;

  @ApiProperty({ description: 'المبلغ الإجمالي للمساهمة', example: 100 })
  @IsNumber()
  @IsPositive({ message: 'المبلغ يجب أن يكون أكبر من صفر' })
  amount: number;

  @ApiPropertyOptional({ description: 'العملة', default: 'SAR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'اسم المحسن / فاعل خير' })
  @IsOptional()
  @IsString()
  donorName?: string;

  @ApiPropertyOptional({ description: 'رقم هاتف المحسن' })
  @IsOptional()
  @IsString()
  donorPhone?: string;

  @ApiPropertyOptional({ description: 'طريقة التحويل أو البنك المستخدم', example: 'AlAmqi' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class RejectContributionDto {
  @ApiProperty({ description: 'سبب رفض المساهمة' })
  @IsString()
  @IsNotEmpty({ message: 'يرجى كتابة سبب الرفض' })
  reason: string;
}
