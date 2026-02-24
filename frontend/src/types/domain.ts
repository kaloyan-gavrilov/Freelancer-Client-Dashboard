export type ProjectStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type ProjectType = 'FIXED' | 'HOURLY';

export interface Project {
  id: string;
  clientId: string;
  freelancerId: string | null;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  status: ProjectStatus;
  projectType: ProjectType;
  agreedRate: number | null;
  skills?: string[];
  bidCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsResponse {
  data: Project[];
  total: number;
  page: number;
  limit: number;
}

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Bid {
  id: string;
  projectId: string;
  freelancerId: string;
  proposedRate: number;
  estimatedDurationDays: number;
  coverLetter: string;
  status: BidStatus;
  createdAt: string;
  updatedAt: string;
}

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  amount: number;
  order: number;
  status: MilestoneStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  freelancerId: string;
  milestoneId: string | null;
  hours: number;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBidPayload {
  proposedRate: number;
  estimatedDurationDays: number;
  coverLetter: string;
}

export interface CreateTimeEntryPayload {
  hours: number;
  description: string;
  date: string;
  milestoneId?: string;
}

export interface ProjectFilters {
  skills?: string;
  budgetMin?: number;
  budgetMax?: number;
  page?: number;
  limit?: number;
}
