export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface MilestoneRecord {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  amount: number;
  order: number;
  status: MilestoneStatus;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
