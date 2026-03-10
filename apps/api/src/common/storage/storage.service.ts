/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';

export interface UploadedFile {
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileType: string;
}

@Injectable()
export class StorageService {
  /**
   * TODO: Replace this with Cloudflare R2 / AWS S3 upload logic.
   *
   * R2 implementation will:
   *  1. Accept the file buffer
   *  2. Generate a unique key (e.g. `documents/{entityType}/{entityId}/{uuid}.{ext}`)
   *  3. Upload to R2 bucket using @aws-sdk/client-s3 (R2 is S3-compatible)
   *  4. Return the object key as filePath
   */

  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<UploadedFile> {
    const ext = originalName.split('.').pop() ?? 'bin';

    // PLACEHOLDER — in production this saves to R2 and returns the object key
    return {
      filePath: `placeholder/documents/${Date.now()}-${originalName}`,
      fileSize: buffer.length,
      mimeType,
      fileType: ext,
    };
  }

  /**
   * TODO: Replace with R2 signed URL generation or deletion.
   * For R2: use GetObjectCommand with presigned URL (expires in 1hr)
   */
  async getSignedUrl(filePath: string): Promise<string> {
    // PLACEHOLDER — return the filePath as-is until R2 is wired up
    return filePath;
  }

  async delete(filePath: string): Promise<void> {
    // TODO: Delete object from R2 bucket using DeleteObjectCommand
    console.log(`[StorageService] TODO: delete ${filePath} from R2`);
  }
}
