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

export interface CreateProjectDTO {
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  projectType: ProjectType;
  requiredSkills?: string[];
}

export interface UpdateProjectStatusDTO {
  status: ProjectStatus;
}

export interface ProjectQuery {
  page?: number;
  limit?: number;
  skills?: string;
  budgetMin?: number;
  budgetMax?: number;
  status?: ProjectStatus;
  freelancerId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
