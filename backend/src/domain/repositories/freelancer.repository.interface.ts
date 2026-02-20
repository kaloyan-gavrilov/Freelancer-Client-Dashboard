import { Freelancer, AvailabilityStatus } from '../entities/freelancer.entity';

/**
 * Repository interface for Freelancer aggregate.
 *
 * @pattern Repository Pattern
 *   Abstracts all data-access logic behind a domain-facing contract so that
 *   the rest of the application never depends on a concrete storage mechanism.
 *
 * @principle Dependency Inversion Principle (DIP)
 *   High-level modules (services, use-cases) depend on this abstraction.
 *   Low-level modules (SupabaseFreelancerRepository) implement it.
 *   NestJS injects the concrete class via the FREELANCER_REPOSITORY token so
 *   services only ever reference this interface.
 */
export interface IFreelancerRepository {
  findById(id: string): Promise<Freelancer | null>;
  findByAvailability(status: AvailabilityStatus): Promise<Freelancer[]>;
  create(data: Omit<Freelancer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Freelancer>;
  update(id: string, data: Partial<Omit<Freelancer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Freelancer>;
  delete(id: string): Promise<void>;
}

export const FREELANCER_REPOSITORY = Symbol('IFreelancerRepository');
