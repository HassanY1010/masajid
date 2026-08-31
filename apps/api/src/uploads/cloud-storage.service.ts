import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

export interface UploadResult {
  url: string;
  storageKey: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  sizeBytes?: number;
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

  /**
   * Upload file with automatic WebP compression and cache headers.
   * For media images: converts to highly optimized WebP format with cache-control.
   */
  async uploadFile(file: Express.Multer.File, folder: 'media' | 'receipts'): Promise<UploadResult> {
    const rawBuffer = file.buffer || (file.path && fs.existsSync(file.path) ? fs.readFileSync(file.path) : null);
    if (!rawBuffer) {
      throw new Error('Unable to read uploaded file buffer');
    }

    let processedBuffer = rawBuffer;
    let extension = path.extname(file.originalname).toLowerCase();
    let mimeType = file.mimetype;

    // Apply Sharp optimization on media images (Resize & compress to WebP)
    if (folder === 'media' && file.mimetype.startsWith('image/')) {
      try {
        processedBuffer = await sharp(rawBuffer)
          .rotate() // Auto-orient based on EXIF
          .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80, effort: 4 })
          .toBuffer();
        extension = '.webp';
        mimeType = 'image/webp';
        this.logger.log(`📸 Image optimized with Sharp: ${rawBuffer.length} bytes -> ${processedBuffer.length} bytes`);
      } catch (err: any) {
        this.logger.warn(`Sharp image processing failed, using original: ${err.message}`);
      }
    }

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const uniqueName = `${folder}/${uniqueId}${extension}`;

    if (this.isSupabaseEnabled && this.supabase) {
      // 1 year immutable cache header for optimized static media
      const cacheControl = folder === 'media' ? '31536000' : '3600';

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(uniqueName, processedBuffer, {
          contentType: mimeType,
          cacheControl: `public, max-age=${cacheControl}, immutable`,
          upsert: true,
        });

      if (error) {
        this.logger.error(`Supabase upload failed: ${error.message}`);
      } else {
        const { data: publicUrlData } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(uniqueName);

        // Cleanup local temp file if multer stored on disk
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {}
        }

        return {
          url: publicUrlData.publicUrl,
          storageKey: uniqueName,
          sizeBytes: processedBuffer.length,
        };
      }
    }

    // Local disk storage fallback with optimized buffer
    const localDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localFilename = `${uniqueId}${extension}`;
    const localFilePath = path.join(localDir, localFilename);
    fs.writeFileSync(localFilePath, processedBuffer);

    // Cleanup multer original if different
    if (file.path && file.path !== localFilePath && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (e) {}
    }

    return {
      url: `/uploads/${folder}/${localFilename}`,
      storageKey: `${folder}/${localFilename}`,
      sizeBytes: processedBuffer.length,
    };
  }

  /**
   * Delete single file from Supabase Storage or local disk.
   */
  async deleteFile(storageKey?: string | null): Promise<boolean> {
    if (!storageKey) return false;
    return (await this.deleteFiles([storageKey])).deletedCount > 0;
  }

  /**
   * Batch delete multiple files from Supabase Storage and local disk with retry resilience.
   */
  async deleteFiles(storageKeys: string[]): Promise<{ deletedCount: number; errors: string[] }> {
    const validKeys = storageKeys.filter((k) => typeof k === 'string' && k.trim().length > 0);
    if (validKeys.length === 0) {
      return { deletedCount: 0, errors: [] };
    }

    let deletedCount = 0;
    const errors: string[] = [];

    // 1. Delete from Supabase Storage if enabled
    if (this.isSupabaseEnabled && this.supabase) {
      try {
        const { data, error } = await this.supabase.storage
          .from(this.bucketName)
          .remove(validKeys);

        if (error) {
          this.logger.error(`Supabase batch delete error: ${error.message}`);
          errors.push(error.message);
        } else if (data) {
          deletedCount += data.length;
          this.logger.log(`🗑️ Removed ${data.length} files from Supabase Storage bucket: ${this.bucketName}`);
        }
      } catch (err: any) {
        this.logger.error(`Supabase batch delete exception: ${err.message}`);
        errors.push(err.message);
      }
    }

    // 2. Also cleanup from local filesystem if keys exist locally
    for (const key of validKeys) {
      try {
        const localFilePath = path.join(process.cwd(), 'uploads', key);
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
          this.logger.log(`🗑️ Removed local disk file: ${localFilePath}`);
          deletedCount++;
        }
      } catch (err: any) {
        this.logger.warn(`Local file deletion failed for ${key}: ${err.message}`);
      }
    }

    return { deletedCount, errors };
  }
}
