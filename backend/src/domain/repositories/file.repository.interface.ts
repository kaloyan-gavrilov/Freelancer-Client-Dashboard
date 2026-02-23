import { FileRecord, FileType } from '../entities/file.entity';

export const FILE_REPOSITORY = Symbol('FILE_REPOSITORY');

export interface CreateFileInput {
  uploaderId: string;
  projectId: string | null;
  milestoneId: string | null;
  name: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileType: FileType;
}

export interface IFileRepository {
  create(input: CreateFileInput): Promise<FileRecord>;
  findById(id: string): Promise<FileRecord | null>;
}
