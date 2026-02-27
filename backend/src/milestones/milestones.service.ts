import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IMilestoneRepository,
  MILESTONE_REPOSITORY,
} from '../domain/repositories/milestone.repository.interface';
import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from '../domain/repositories/project.repository.interface';
import { MilestoneRecord, MilestoneStatus } from '../domain/entities/milestone.entity';
import { CreateMilestoneDto } from './dto/create-milestone.dto';

@Injectable()
export class MilestonesService {
  constructor(
    @Inject(MILESTONE_REPOSITORY)
    private readonly milestoneRepo: IMilestoneRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  async findByProject(projectId: string): Promise<MilestoneRecord[]> {
    return this.milestoneRepo.findByProjectId(projectId);
  }

  async create(
    projectId: string,
    dto: CreateMilestoneDto,
    clientId: string,
  ): Promise<MilestoneRecord> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with id "${projectId}" not found`);
    }
    if (project.clientId !== clientId) {
      throw new ForbiddenException('You do not own this project');
    }

    return this.milestoneRepo.create({
      projectId,
      title: dto.title,
      description: dto.description ?? null,
      amount: dto.amount,
      order: dto.order,
      dueDate: project.deadline,
      status: 'PENDING',
    });
  }

  async updateStatus(
    milestoneId: string,
    status: MilestoneStatus,
  ): Promise<MilestoneRecord> {
    const milestone = await this.milestoneRepo.findById(milestoneId);
    if (!milestone) {
      throw new NotFoundException(`Milestone with id "${milestoneId}" not found`);
    }

    return this.milestoneRepo.updateStatus(milestoneId, status);
  }
}
