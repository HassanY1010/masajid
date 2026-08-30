import { Module } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import {
  BankAccountsPublicController,
  BankAccountsAdminController,
} from './bank-accounts.controller';

@Module({
  controllers: [BankAccountsPublicController, BankAccountsAdminController],
  providers: [BankAccountsService],
  exports: [BankAccountsService],
})
export class BankAccountsModule {}
