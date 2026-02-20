import { Bid, BidStatus } from '../entities/bid.entity';

/**
 * Repository interface for Bid aggregate.
 *
 * @pattern Repository Pattern
 *   Abstracts all data-access logic behind a domain-facing contract so that
 *   the rest of the application never depends on a concrete storage mechanism.
 *
 * @principle Dependency Inversion Principle (DIP)
 *   High-level modules (services, use-cases) depend on this abstraction.
 *   Low-level modules (SupabaseBidRepository) implement it.
 *   NestJS injects the concrete class via the BID_REPOSITORY token so
 *   services only ever reference this interface.
 */
export interface IBidRepository {
  findById(id: string): Promise<Bid | null>;
  findByProjectId(projectId: string): Promise<Bid[]>;
  findByFreelancerId(freelancerId: string): Promise<Bid[]>;
  findByStatus(status: BidStatus): Promise<Bid[]>;
  create(data: Omit<Bid, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bid>;
  update(id: string, data: Partial<Omit<Bid, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Bid>;
  delete(id: string): Promise<void>;
}

export const BID_REPOSITORY = Symbol('IBidRepository');
