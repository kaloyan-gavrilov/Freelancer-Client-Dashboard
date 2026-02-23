import { Module } from '@nestjs/common';
import { SupabaseClientService } from '../supabase/supabase.client';
import { SupabaseProjectRepository } from './supabase-project.repository';
import { SupabaseFreelancerRepository } from './supabase-freelancer.repository';
import { SupabaseBidRepository } from './supabase-bid.repository';
import { SupabaseMilestoneRepository } from './supabase-milestone.repository';
import { SupabaseTimeEntryRepository } from './supabase-time-entry.repository';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository.interface';
import { FREELANCER_REPOSITORY } from '../../domain/repositories/freelancer.repository.interface';
import { BID_REPOSITORY } from '../../domain/repositories/bid.repository.interface';
import { MILESTONE_REPOSITORY } from '../../domain/repositories/milestone.repository.interface';
import { TIME_ENTRY_REPOSITORY } from '../../domain/repositories/time-entry.repository.interface';

@Module({
  providers: [
    SupabaseClientService,
    { provide: PROJECT_REPOSITORY, useClass: SupabaseProjectRepository },
    { provide: FREELANCER_REPOSITORY, useClass: SupabaseFreelancerRepository },
    { provide: BID_REPOSITORY, useClass: SupabaseBidRepository },
    { provide: MILESTONE_REPOSITORY, useClass: SupabaseMilestoneRepository },
    { provide: TIME_ENTRY_REPOSITORY, useClass: SupabaseTimeEntryRepository },
  ],
  exports: [
    PROJECT_REPOSITORY,
    FREELANCER_REPOSITORY,
    BID_REPOSITORY,
    MILESTONE_REPOSITORY,
    TIME_ENTRY_REPOSITORY,
  ],
})
export class RepositoriesModule {}
