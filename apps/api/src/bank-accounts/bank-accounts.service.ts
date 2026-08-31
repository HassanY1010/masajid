import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/bank-account.dto';
import { AuditAction } from '@masajid/shared-types';
import { MemoryCacheService } from '../common/cache/memory-cache.service';

@Injectable()
export class BankAccountsService {
  private readonly logger = new Logger(BankAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cache: MemoryCacheService,
  ) {}

  // Public: Get all active bank accounts sorted (Cached for 60s with instant mutation invalidation)
  async getPublicAccounts() {
    return this.cache.getOrSet('bank_accounts:public', 60000, async () => {
      return this.prisma.bankAccount.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
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

    this.cache.invalidate('bank_accounts');

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

    this.cache.invalidate('bank_accounts');

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

    this.cache.invalidate('bank_accounts');

    return { message: 'تم حذف الحساب البنكي بنجاح' };
  }
}
