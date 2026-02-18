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
  deadline: Date;
  status: ProjectStatus;
  projectType: ProjectType;
  agreedRate: number | null;
  createdAt: Date;
  updatedAt: Date;
}
