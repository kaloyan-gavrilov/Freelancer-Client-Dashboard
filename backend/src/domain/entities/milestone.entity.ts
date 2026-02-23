export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface MilestoneRecord {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  amount: number;
  order: number;
  status: MilestoneStatus;
  createdAt: Date;
  updatedAt: Date;
}
