import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Redirect,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Express } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../domain/user/user-role.enum';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import { FileUploadService } from './file-upload.service';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneStatusDto } from './dto/update-milestone-status.dto';

@ApiTags('Milestones')
@Controller()
export class MilestonesController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly milestonesService: MilestonesService,
  ) {}

  @Get('projects/:id/milestones')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get milestones for a project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'List of milestones' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByProject(@Param('id') projectId: string) {
    return this.milestonesService.findByProject(projectId);
  }

  @Post('projects/:id/milestones')
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a milestone (CLIENT only)' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 201, description: 'Milestone created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — CLIENT role required' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async createMilestone(
    @Param('id') projectId: string,
    @Body() dto: CreateMilestoneDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.milestonesService.create(projectId, dto, req.user.id);
  }

  @Patch('milestones/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update milestone status' })
  @ApiParam({ name: 'id', description: 'Milestone UUID' })
  @ApiResponse({ status: 200, description: 'Milestone updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  async updateMilestoneStatus(
    @Param('id') milestoneId: string,
    @Body() dto: UpdateMilestoneStatusDto,
  ) {
    return this.milestonesService.updateStatus(milestoneId, dto.status);
  }

  @Post('milestones/:id/files')
  @Roles(UserRole.FREELANCER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a deliverable file (FREELANCER only)' })
  @ApiParam({ name: 'id', description: 'Milestone UUID' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project UUID' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — FREELANCER role required' })
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

  @Get('files/:id/download')
  @Redirect()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download a file (presigned URL redirect)' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiResponse({ status: 302, description: 'Redirect to presigned download URL' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(
    @Param('id') fileId: string,
  ): Promise<{ url: string; statusCode: number }> {
    const url = await this.fileUploadService.getDownloadUrl(fileId);
    return { url, statusCode: 302 };
  }
}
