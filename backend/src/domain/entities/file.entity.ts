export type FileType = 'DELIVERABLE' | 'PORTFOLIO' | 'ATTACHMENT';

export interface FileRecord {
  id: string;
  uploaderId: string;
  projectId: string | null;
  milestoneId: string | null;
  name: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileType: FileType;
  createdAt: Date;
}
