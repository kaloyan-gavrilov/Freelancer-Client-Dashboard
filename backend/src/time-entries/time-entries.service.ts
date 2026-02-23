import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ITimeEntryRepository,
  TIME_ENTRY_REPOSITORY,
} from '../domain/repositories/time-entry.repository.interface';
import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from '../domain/repositories/project.repository.interface';
import { TimeEntry } from '../domain/entities/time-entry.entity';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';

@Injectable()
export class TimeEntriesService {
  constructor(
    @Inject(TIME_ENTRY_REPOSITORY)
    private readonly timeEntryRepo: ITimeEntryRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  async findByProject(projectId: string): Promise<TimeEntry[]> {
    return this.timeEntryRepo.findByProjectId(projectId);
  }

  async create(
    projectId: string,
    dto: CreateTimeEntryDto,
    freelancerId: string,
  ): Promise<TimeEntry> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with id "${projectId}" not found`);
    }

    return this.timeEntryRepo.create({
      projectId,
      freelancerId,
      milestoneId: dto.milestoneId ?? null,
      hours: dto.hours,
      description: dto.description,
      date: new Date(dto.date),
    });
  }
}
