import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface UploadedFile {
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileType: string;
}

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    this.bucket = process.env.R2_BUCKET_NAME ?? '';

    // S3Client pointed at R2 endpoint instead of AWS
    // R2 uses same API as S3, so the SDK works as-is
    this.client = new S3Client({
      region: 'auto', // R2 requires 'auto' as the region
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<UploadedFile> {
    const ext = originalName.split('.').pop() ?? 'bin';
    // Unique key: `documents/{timestamp}-{originalName}`
    // Organized by year/month/day so the bucket doesn't get too flat (optional but recommended for large buckets)
    const now = new Date();
    const key = `documents/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${randomUUID()}.${ext}`;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          ContentLength: buffer.length, // required by R2
        }),
      );
    } catch (err) {
      console.error('[StorageService] R2 upload failed:', err);
      throw new InternalServerErrorException('File upload failed');
    }

    return {
      filePath: key, // We store the key, not full URL — URLs are generated on demand
      fileSize: buffer.length,
      mimeType,
      fileType: ext,
    };
  }

  // ─── SIGNED URL ───────────────────────────────────────────────────────────────
  // Generates a temporary URL valid for 1 hour
  // Frontend calls this when user clicks "View" or "Download"
  async getSignedUrl(
    filePath: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────────
  async delete(filePath: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: filePath,
        }),
      );
    } catch (err) {
      // Log but don't throw — document soft-delete should still succeed
      // even if R2 delete fails (can be cleaned up later)
      console.error('[StorageService] R2 delete failed:', err);
    }
  }
}
