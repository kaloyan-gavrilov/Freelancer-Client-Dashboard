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

export interface CreateTimeEntryDTO {
  hours: number;
  description: string;
  date: string;
  milestoneId?: string;
}
