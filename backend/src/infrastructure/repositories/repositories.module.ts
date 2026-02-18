import { Module } from '@nestjs/common';
import { SupabaseClientService } from '../supabase/supabase.client';
import { SupabaseProjectRepository } from './supabase-project.repository';
import { SupabaseFreelancerRepository } from './supabase-freelancer.repository';
import { SupabaseBidRepository } from './supabase-bid.repository';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository.interface';
import { FREELANCER_REPOSITORY } from '../../domain/repositories/freelancer.repository.interface';
import { BID_REPOSITORY } from '../../domain/repositories/bid.repository.interface';

/**
 * Registers the three Supabase repository implementations under their
 * interface tokens so that any service can inject e.g.:
 *
 *   @Inject(PROJECT_REPOSITORY) private readonly projects: IProjectRepository
 *
 * Services depend only on the interface token — never on the concrete class.
 * This satisfies the Dependency Inversion Principle (DIP).
 */
@Module({
  providers: [
    SupabaseClientService,
    { provide: PROJECT_REPOSITORY, useClass: SupabaseProjectRepository },
    { provide: FREELANCER_REPOSITORY, useClass: SupabaseFreelancerRepository },
    { provide: BID_REPOSITORY, useClass: SupabaseBidRepository },
  ],
  exports: [PROJECT_REPOSITORY, FREELANCER_REPOSITORY, BID_REPOSITORY],
})
export class RepositoriesModule {}
