import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from '../domain/repositories/project.repository.interface';
import { Project, ProjectStatus } from '../domain/entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectStateMachine } from '../domain/project/ProjectStateMachine';
import { ProjectState } from '../domain/project/ProjectState';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly projectRepo: IProjectRepository,
  ) {}

  async create(dto: CreateProjectDto, clientId: string): Promise<Project> {
    return this.projectRepo.create({
      clientId,
      freelancerId: null,
      title: dto.title,
      description: dto.description,
      budgetMin: dto.budgetMin,
      budgetMax: dto.budgetMax,
      deadline: new Date(dto.deadline),
      status: dto.initialStatus ?? 'DRAFT',
      projectType: dto.projectType,
      agreedRate: null,
    });
  }

  async findAll(query: ProjectQueryDto): Promise<{ data: Project[]; total: number }> {
    let projects: Project[];

    if (query.clientId) {
      projects = await this.projectRepo.findByClientId(query.clientId);
      if (query.status) {
        projects = projects.filter((p) => p.status === query.status);
      }
    } else if (query.freelancerId) {
      projects = await this.projectRepo.findByFreelancerId(query.freelancerId);
      if (query.status) {
        projects = projects.filter((p) => p.status === query.status);
      }
    } else if (query.status) {
      projects = await this.projectRepo.findByStatus(query.status as ProjectStatus);
    } else {
      projects = await this.projectRepo.findByStatus('OPEN');
    }

    if (query.budgetMin !== undefined) {
      projects = projects.filter((p) => p.budgetMax >= query.budgetMin!);
    }
    if (query.budgetMax !== undefined) {
      projects = projects.filter((p) => p.budgetMin <= query.budgetMax!);
    }

    const total = projects.length;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;
    const data = projects.slice(start, start + limit);

    return { data, total };
  }

  async findById(id: string): Promise<Project> {
    const project = await this.projectRepo.findById(id);
    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }
    return project;
  }

  async updateStatus(
    id: string,
    newStatus: ProjectStatus,
    clientId: string,
  ): Promise<Project> {
    const project = await this.findById(id);

    if (project.clientId !== clientId) {
      throw new ForbiddenException('You do not own this project');
    }

    try {
      ProjectStateMachine.assertTransition(
        this.mapStatusToState(project.status),
        this.mapStatusToState(newStatus),
      );
    } catch {
      throw new ConflictException(
        `Invalid status transition: ${project.status} → ${newStatus}`,
      );
    }

    return this.projectRepo.update(id, { status: newStatus });
  }

  async remove(id: string, clientId: string): Promise<void> {
    const project = await this.findById(id);

    if (project.clientId !== clientId) {
      throw new ForbiddenException('You do not own this project');
    }

    if (project.status !== 'DRAFT') {
      throw new ConflictException('Only projects in DRAFT status can be deleted');
    }

    await this.projectRepo.delete(id);
  }

  private mapStatusToState(status: ProjectStatus): ProjectState {
    const map: Record<string, ProjectState> = {
      DRAFT: ProjectState.DRAFT,
      OPEN: ProjectState.OPEN,
      IN_PROGRESS: ProjectState.IN_PROGRESS,
      COMPLETED: ProjectState.COMPLETED,
      CANCELLED: ProjectState.CLOSED,
    };
    return map[status] ?? ProjectState.DRAFT;
  }
}
