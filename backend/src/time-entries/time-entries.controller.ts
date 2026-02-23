import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../domain/user/user-role.enum';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';

@ApiTags('Time Entries')
@Controller('projects/:projectId/time-entries')
@ApiBearerAuth()
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Post()
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: 'Log a time entry (FREELANCER only)' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 201, description: 'Time entry created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — FREELANCER role required' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTimeEntryDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.timeEntriesService.create(projectId, dto, req.user.id);
  }

  @Get()
  @Roles(UserRole.CLIENT, UserRole.FREELANCER)
  @ApiOperation({ summary: 'Get time entries for a project (CLIENT + FREELANCER)' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'List of time entries' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByProject(@Param('projectId') projectId: string) {
    return this.timeEntriesService.findByProject(projectId);
  }
}
