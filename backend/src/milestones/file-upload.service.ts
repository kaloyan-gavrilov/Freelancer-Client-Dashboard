import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Express } from 'express';
import { SupabaseClientService } from '../infrastructure/supabase/supabase.client';
import {
  FILE_REPOSITORY,
  IFileRepository,
} from '../domain/repositories/file.repository.interface';
import { FileRecord } from '../domain/entities/file.entity';

/** Supabase Storage bucket name. Must be created with public access disabled. */
const BUCKET = 'deliverables';

/** Presigned URL TTL in seconds (1 hour). */
const SIGNED_URL_TTL_SECONDS = 3600;

export interface UploadResult {
  file: FileRecord;
  /** Presigned download URL valid for 1 hour. */
  downloadUrl: string;
}

@Injectable()
export class FileUploadService {
  constructor(
    private readonly supabase: SupabaseClientService,
    @Inject(FILE_REPOSITORY) private readonly fileRepo: IFileRepository,
  ) {}

  /**
   * Uploads a file to Supabase Storage and persists its metadata to the DB.
   *
   * Storage path: deliverables/{projectId}/{milestoneId}/{filename}
   *
   * @returns the persisted FileRecord and a presigned URL (1 h TTL).
   */
  async upload(
    file: Express.Multer.File,
    milestoneId: string,
    projectId: string,
    uploaderId: string,
  ): Promise<UploadResult> {
    const storagePath = `${projectId}/${milestoneId}/${Date.now()}-${file.originalname}`;

    const { error: storageError } = await this.supabase.client.storage
      .from(BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (storageError) {
      throw new Error(`Storage upload failed: ${storageError.message}`);
    }

    const fileRecord = await this.fileRepo.create({
      uploaderId,
      projectId,
      milestoneId,
      name: file.originalname,
      filePath: storagePath,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileType: 'DELIVERABLE',
    });

    const downloadUrl = await this.createSignedUrl(storagePath);

    return { file: fileRecord, downloadUrl };
  }

  /**
   * Creates a presigned download URL for an existing file record.
   * Used by GET /files/:id/download.
   *
   * @returns a presigned URL valid for 1 hour.
   */
  async getDownloadUrl(fileId: string): Promise<string> {
    const fileRecord = await this.fileRepo.findById(fileId);
    if (!fileRecord) {
      throw new NotFoundException(`File with id "${fileId}" not found.`);
    }

    return this.createSignedUrl(fileRecord.filePath);
  }

  private async createSignedUrl(storagePath: string): Promise<string> {
    const { data, error } = await this.supabase.client.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to create signed URL: ${error?.message}`);
    }

    return data.signedUrl;
  }
}
