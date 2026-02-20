import { Project, ProjectStatus } from '../entities/project.entity';

/**
 * Repository interface for Project aggregate.
 *
 * @pattern Repository Pattern
 *   Abstracts all data-access logic behind a domain-facing contract so that
 *   the rest of the application never depends on a concrete storage mechanism.
 *
 * @principle Dependency Inversion Principle (DIP)
 *   High-level modules (services, use-cases) depend on this abstraction.
 *   Low-level modules (SupabaseProjectRepository) implement it.
 *   NestJS injects the concrete class via the PROJECT_REPOSITORY token so
 *   services only ever reference this interface.
 */
export interface IProjectRepository {
  findById(id: string): Promise<Project | null>;
  findByClientId(clientId: string): Promise<Project[]>;
  findByFreelancerId(freelancerId: string): Promise<Project[]>;
  findByStatus(status: ProjectStatus): Promise<Project[]>;
  create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  update(id: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Project>;
  delete(id: string): Promise<void>;
}

export const PROJECT_REPOSITORY = Symbol('IProjectRepository');
