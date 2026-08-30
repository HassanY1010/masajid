import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/bank-account.dto';
import { AuditAction } from '@masajid/shared-types';

@Injectable()
export class BankAccountsService {
  private readonly logger = new Logger(BankAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // Public: Get all active bank accounts sorted
  async getPublicAccounts() {
    return this.prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Admin: Get all bank accounts (active & inactive)
  async getAdminAccounts() {
    return this.prisma.bankAccount.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Admin: Create bank account
  async createAccount(dto: CreateBankAccountDto, adminId?: string) {
    const account = await this.prisma.bankAccount.create({
      data: dto,
    });

    await this.auditService.log({
      adminId,
      action: AuditAction.ADMIN_CREATED_BANK_ACCOUNT,
      entity: 'BankAccount',
      entityId: account.id,
      metadata: { displayName: account.displayName, accountNumber: account.accountNumber },
    });

    return account;
  }

  // Admin: Update bank account
  async updateAccount(id: string, dto: UpdateBankAccountDto, adminId?: string) {
    const existing = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('الحساب البنكي غير موجود');
    }

    const updated = await this.prisma.bankAccount.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      adminId,
      action: AuditAction.ADMIN_UPDATED_BANK_ACCOUNT,
      entity: 'BankAccount',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }

  // Admin: Delete bank account
  async deleteAccount(id: string, adminId?: string) {
    const existing = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('الحساب البنكي غير موجود');
    }

    await this.prisma.bankAccount.delete({ where: { id } });

    await this.auditService.log({
      adminId,
      action: AuditAction.ADMIN_DELETED_BANK_ACCOUNT,
      entity: 'BankAccount',
      entityId: id,
    });

    return { message: 'تم حذف الحساب البنكي بنجاح' };
  }
}
