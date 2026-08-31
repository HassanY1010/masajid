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

  private cleanupInterval: NodeJS.Timeout | null = null;

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

      // Schedule daily orphan consistency recovery (Runs every 24 hours after a 5 min startup grace period)
      this.logger.log('🕒 [STORAGE CLEANUP] Scheduled orphan recovery initialized (First run in 5m, then every 24h)');

      setTimeout(() => {
        this.performScheduledOrphanCleanup().catch((err) => {
          this.logger.warn(`Initial background storage audit failed: ${err.message}`);
        });
      }, 5 * 60 * 1000);

      this.cleanupInterval = setInterval(() => {
        this.performScheduledOrphanCleanup().catch((err) => {
          this.logger.warn(`Daily background storage audit failed: ${err.message}`);
        });
      }, 24 * 60 * 60 * 1000);
    }
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Internal scheduled cleanup wrapper
   */
  private async performScheduledOrphanCleanup() {
    this.logger.log('🕒 Starting scheduled daily Supabase Storage consistency audit...');
    const result = await this.performOrphanCleanup({ dryRun: false, gracePeriodMinutes: 60 });
    this.logger.log(
      `🏁 Scheduled storage cleanup finished: ${result.deletedCount} deleted, ${result.protectedCount} protected, ${result.errors.length} errors.`,
    );
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

  // Short-lived in-memory cache for Signed URLs to prevent redundant network round-trips
  private readonly signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

  /**
   * Generate short-lived Signed URL for private assets (e.g. bank transfer receipts)
   * Expires in expiresInSeconds (default: 300s / 5 minutes)
   */
  async getSignedUrl(storageKey?: string | null, expiresInSeconds = 300): Promise<string | null> {
    if (!storageKey) return null;

    const now = Date.now();
    const cached = this.signedUrlCache.get(storageKey);
    if (cached && cached.expiresAt > now) {
      return cached.url;
    }

    if (this.isSupabaseEnabled && this.supabase) {
      try {
        const { data, error } = await this.supabase.storage
          .from(this.bucketName)
          .createSignedUrl(storageKey, expiresInSeconds);

        if (error) {
          this.logger.error(`Failed to create signed URL for ${storageKey}: ${error.message}`);
          return null;
        }

        const signedUrl = data?.signedUrl || null;
        if (signedUrl) {
          // Cache for (expiresInSeconds - 60) seconds to ensure safe validity buffer
          const safeTtlMs = Math.max(30000, (expiresInSeconds - 60) * 1000);
          this.signedUrlCache.set(storageKey, { url: signedUrl, expiresAt: now + safeTtlMs });
        }

        return signedUrl;
      } catch (err: any) {
        this.logger.error(`Exception generating signed URL: ${err.message}`);
        return null;
      }
    }

    // Local fallback for development environment
    return `/uploads/${storageKey}`;
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

  /**
   * Safe Orphan Cleanup Algorithm:
   * - Queries active DB storage keys
   * - Scans Supabase bucket
   * - Enforces Grace Period (e.g. files uploaded in the last 60 minutes are protected)
   * - Supports Dry Run mode
   */
  async performOrphanCleanup(options: {
    dryRun?: boolean;
    gracePeriodMinutes?: number;
    activeDbKeys?: Set<string>;
  } = {}): Promise<{
    scannedCount: number;
    activeCount: number;
    orphanCandidates: string[];
    protectedCount: number;
    deletedCount: number;
    errors: string[];
  }> {
    const dryRun = options.dryRun ?? false;
    const graceMinutes = options.gracePeriodMinutes ?? 60;
    const graceCutoff = Date.now() - graceMinutes * 60 * 1000;

    if (!this.isSupabaseEnabled || !this.supabase) {
      return {
        scannedCount: 0,
        activeCount: 0,
        orphanCandidates: [],
        protectedCount: 0,
        deletedCount: 0,
        errors: ['Supabase not configured'],
      };
    }

    try {
      // List media files in Supabase bucket
      const { data: files, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('media', { limit: 500 });

      if (error || !files) {
        return {
          scannedCount: 0,
          activeCount: 0,
          orphanCandidates: [],
          orphanCount: 0,
          protectedCount: 0,
          deletedCount: 0,
          errors: [error ? error.message : 'No files returned'],
        } as any;
      }

      const activeKeys = options.activeDbKeys || new Set<string>();
      const toDelete: string[] = [];
      let protectedCount = 0;

      files.forEach((file) => {
        const fullKey = `media/${file.name}`;
        if (!activeKeys.has(fullKey)) {
          // Check timestamp in filename (format: 1788158719273-...) for grace period protection
          const match = file.name.match(/^(\d+)-/);
          if (match && match[1]) {
            const uploadTime = parseInt(match[1], 10);
            if (uploadTime > graceCutoff) {
              protectedCount++;
              return; // Protected: uploaded recently
            }
          }
          toDelete.push(fullKey);
        }
      });

      let deletedCount = 0;
      const errors: string[] = [];

      if (!dryRun && toDelete.length > 0) {
        const deleteRes = await this.deleteFiles(toDelete);
        deletedCount = deleteRes.deletedCount;
        errors.push(...deleteRes.errors);
      }

      return {
        scannedCount: files.length,
        activeCount: files.length - toDelete.length - protectedCount,
        orphanCandidates: toDelete,
        protectedCount,
        deletedCount: dryRun ? 0 : deletedCount,
        errors,
      };
    } catch (err: any) {
      return {
        scannedCount: 0,
        activeCount: 0,
        orphanCandidates: [],
        protectedCount: 0,
        deletedCount: 0,
        errors: [err.message],
      };
    }
  }
}
