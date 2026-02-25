// Re-export barrel — canonical types now live in per-domain files.
// All existing imports from '@/types/domain' continue to work unchanged.

export type {
  ProjectStatus,
  ProjectType,
  Project,
  CreateProjectDTO,
  UpdateProjectStatusDTO,
  ProjectQuery,
  PaginatedResponse,
} from './project';

export type {
  BidStatus,
  BidRankBy,
  Bid,
  CreateBidDTO,
} from './bid';

export type {
  MilestoneStatus,
  Milestone,
  CreateMilestoneDTO,
  UpdateMilestoneDTO,
} from './milestone';

export type { TimeEntry, CreateTimeEntryDTO } from './timeEntry';

// ---- Legacy aliases — kept for backward compatibility with existing hooks/components ----

import type { PaginatedResponse, Project, ProjectQuery } from './project';
import type { CreateBidDTO } from './bid';
import type { CreateTimeEntryDTO } from './timeEntry';

/** @deprecated Use ProjectQuery from '@/types/project' */
export type ProjectFilters = ProjectQuery;

/** @deprecated Use PaginatedResponse<Project> from '@/types/project' */
export type ProjectsResponse = PaginatedResponse<Project>;

/** @deprecated Use CreateBidDTO from '@/types/bid' */
export type CreateBidPayload = CreateBidDTO;

/** @deprecated Use CreateTimeEntryDTO from '@/types/timeEntry' */
export type CreateTimeEntryPayload = CreateTimeEntryDTO;
