import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBankAccountDto {
  @ApiProperty({ description: 'الرمز التعريفي للبنك', example: 'AlAmqi' })
  @IsString()
  @IsNotEmpty({ message: 'اسم البنك التعريفي مطلوب' })
  name: string;

  @ApiProperty({ description: 'الاسم المعروض للمستخدم', example: 'شركة العمقي وإخوانه للصرافة' })
  @IsString()
  @IsNotEmpty({ message: 'الاسم المعروض مطلوب' })
  displayName: string;

  @ApiProperty({ description: 'اسم صاحب الحساب الرسمي', example: 'مشروع مساجد لخدمة بيوت الله' })
  @IsString()
  @IsNotEmpty({ message: 'اسم الحساب مطلوب' })
  accountName: string;

  @ApiProperty({ description: 'رقم الحساب البنكي', example: '254019283' })
  @IsString()
  @IsNotEmpty({ message: 'رقم الحساب مطلوب' })
  accountNumber: string;

  @ApiPropertyOptional({ description: 'الآيبان الدولي إن وجد' })
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional({ description: 'العملة', default: 'SAR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'شعار البنك' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'حالة التفعيل', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ترتيب العرض', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateBankAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
