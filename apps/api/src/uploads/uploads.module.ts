import { Module, Global } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { CloudStorageService } from './cloud-storage.service';

@Global()
@Module({
  controllers: [UploadsController],
  providers: [CloudStorageService],
  exports: [CloudStorageService],
})
export class UploadsModule {}
