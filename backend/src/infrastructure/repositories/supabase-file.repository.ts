import { Injectable } from '@nestjs/common';
import { FileRecord, FileType } from '../../domain/entities/file.entity';
import {
  CreateFileInput,
  IFileRepository,
} from '../../domain/repositories/file.repository.interface';
import { SupabaseClientService } from '../supabase/supabase.client';

type FileRow = {
  id: string;
  uploader_id: string;
  project_id: string | null;
  milestone_id: string | null;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_type: FileType;
  created_at: string;
};

function toFileRecord(row: FileRow): FileRecord {
  return {
    id: row.id,
    uploaderId: row.uploader_id,
    projectId: row.project_id,
    milestoneId: row.milestone_id,
    name: row.name,
    filePath: row.file_path,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    fileType: row.file_type,
    createdAt: new Date(row.created_at),
  };
}

@Injectable()
export class SupabaseFileRepository implements IFileRepository {
  constructor(private readonly supabase: SupabaseClientService) {}

  async create(input: CreateFileInput): Promise<FileRecord> {
    const { data, error } = await this.supabase.client
      .from('files')
      .insert({
        uploader_id: input.uploaderId,
        project_id: input.projectId,
        milestone_id: input.milestoneId,
        name: input.name,
        file_path: input.filePath,
        file_size: input.fileSize,
        mime_type: input.mimeType,
        file_type: input.fileType,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create file record: ${error?.message}`);
    }

    return toFileRecord(data as FileRow);
  }

  async findById(id: string): Promise<FileRecord | null> {
    const { data, error } = await this.supabase.client
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return toFileRecord(data as FileRow);
  }
}
