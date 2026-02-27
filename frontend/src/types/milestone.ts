export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  amount: number;
  order: number;
  status: MilestoneStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestoneDTO {
  title: string;
  description?: string;
  amount: number;
  order: number;
}

export interface UpdateMilestoneDTO {
  status: MilestoneStatus;
}
