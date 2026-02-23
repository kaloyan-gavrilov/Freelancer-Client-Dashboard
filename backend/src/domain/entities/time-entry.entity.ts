export interface TimeEntry {
  id: string;
  projectId: string;
  freelancerId: string;
  milestoneId: string | null;
  hours: number;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
