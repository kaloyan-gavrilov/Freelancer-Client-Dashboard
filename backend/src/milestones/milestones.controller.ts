import {
  Controller,
  Get,
  Param,
  Post,
  Redirect,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import { FileUploadService } from './file-upload.service';
import { Express } from 'express';

/**
 * MilestonesController handles file upload and download for milestone deliverables.
 *
 * POST /milestones/:id/files   — upload a deliverable (multipart/form-data, field "file")
 * GET  /files/:id/download     — redirect to a presigned 1-hour download URL
 *
 * Both routes are protected by the global SupabaseAuthGuard + RolesGuard pipeline.
 */
@Controller()
export class MilestonesController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  /**
   * Upload a deliverable file for a milestone.
   *
   * Multer stores the file in memory (no temp disk writes).
   * FileValidationPipe validates MIME type and size before the service is called.
   *
   * Query param: projectId is required to build the storage path.
   * (A real implementation would look up the milestone's projectId from the DB;
   * for this iteration it is provided as a query param to avoid an extra round-trip.)
   */
  @Post('milestones/:id/files')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id') milestoneId: string,
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @Req() req: Request & { user: AuthenticatedUser; query: { projectId: string } },
  ): Promise<{
    fileId: string;
    name: string;
    mimeType: string;
    fileSize: number;
    downloadUrl: string;
  }> {
    const projectId = req.query['projectId'] as string;
    const uploaderId = req.user.id;

    const { file: fileRecord, downloadUrl } = await this.fileUploadService.upload(
      file,
      milestoneId,
      projectId,
      uploaderId,
    );

    return {
      fileId: fileRecord.id,
      name: fileRecord.name,
      mimeType: fileRecord.mimeType,
      fileSize: fileRecord.fileSize,
      downloadUrl,
    };
  }

  /**
   * Redirect to a presigned Supabase Storage URL (1 hour TTL).
   * Returns HTTP 302 so clients follow the redirect automatically.
   */
  @Get('files/:id/download')
  @Redirect()
  async downloadFile(
    @Param('id') fileId: string,
  ): Promise<{ url: string; statusCode: number }> {
    const url = await this.fileUploadService.getDownloadUrl(fileId);
    return { url, statusCode: 302 };
  }
}
