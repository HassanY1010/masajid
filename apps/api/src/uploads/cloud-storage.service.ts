import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadResult {
  url: string;
  storageKey: string;
}

@Injectable()
export class CloudStorageService implements OnModuleInit {
  private readonly logger = new Logger(CloudStorageService.name);
  private supabase: SupabaseClient | null = null;
  private readonly bucketName: string;
  private readonly isSupabaseEnabled: boolean;

  constructor(private readonly config: ConfigService) {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const supabaseKey =
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.config.get<string>('SUPABASE_ANON_KEY');

    this.bucketName = this.config.get<string>('SUPABASE_BUCKET', 'masajid-uploads');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.isSupabaseEnabled = true;
    } else {
      this.isSupabaseEnabled = false;
    }
  }

  async onModuleInit() {
    if (this.isSupabaseEnabled && this.supabase) {
      try {
        const { data: buckets } = await this.supabase.storage.listBuckets();
        const exists = buckets?.some((b) => b.name === this.bucketName);
        if (!exists) {
          await this.supabase.storage.createBucket(this.bucketName, { public: true });
          this.logger.log(`Created public Supabase storage bucket: ${this.bucketName}`);
        }
        this.logger.log(`✅ Supabase Cloud Storage active on bucket: ${this.bucketName}`);
      } catch (err: any) {
        this.logger.warn(`Supabase bucket status check: ${err.message}`);
      }
    }
  }

  async uploadFile(file: Express.Multer.File, folder: 'media' | 'receipts'): Promise<UploadResult> {
    if (this.isSupabaseEnabled && this.supabase) {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
      const fileBuffer = file.buffer || fs.readFileSync(file.path);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(uniqueName, fileBuffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        this.logger.error(`Supabase upload failed: ${error.message}`);
        // Fallback to local storage if supabase storage fails
      } else {
        const { data: publicUrlData } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(uniqueName);

        // Delete temporary local file if created by multer
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return {
          url: publicUrlData.publicUrl,
          storageKey: uniqueName,
        };
      }
    }

    // Default local storage URL
    const localUrl = `/uploads/${folder}/${file.filename}`;
    return {
      url: localUrl,
      storageKey: `${folder}/${file.filename}`,
    };
  }
}
