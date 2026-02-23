import { TimeEntry } from '../entities/time-entry.entity';

export interface ITimeEntryRepository {
  findByProjectId(projectId: string): Promise<TimeEntry[]>;
  create(data: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeEntry>;
}

export const TIME_ENTRY_REPOSITORY = Symbol('ITimeEntryRepository');
