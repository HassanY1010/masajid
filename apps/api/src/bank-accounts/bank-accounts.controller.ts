import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/bank-account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Bank Accounts (Public)')
@Controller('bank-accounts')
export class BankAccountsPublicController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'استعراض الحسابات البنكية المعتمدة لتحويل المساهمات' })
  async getPublicAccounts() {
    return this.bankAccountsService.getPublicAccounts();
  }
}

@ApiTags('Admin Bank Accounts')
@Controller('admin/bank-accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BankAccountsAdminController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'لوحة التحكم: إدارة الحسابات البنكية' })
  async getAdminAccounts() {
    return this.bankAccountsService.getAdminAccounts();
  }

  @Post()
  @ApiOperation({ summary: 'لوحة التحكم: إضافة حساب بنكي جديد' })
  async createAccount(
    @Body() dto: CreateBankAccountDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.bankAccountsService.createAccount(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'لوحة التحكم: تعديل حساب بنكي' })
  async updateAccount(
    @Param('id') id: string,
    @Body() dto: UpdateBankAccountDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.bankAccountsService.updateAccount(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'لوحة التحكم: حذف حساب بنكي' })
  async deleteAccount(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.bankAccountsService.deleteAccount(id, user.id);
  }
}
