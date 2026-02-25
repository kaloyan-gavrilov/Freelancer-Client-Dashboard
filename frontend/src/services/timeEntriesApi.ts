import type { TimeEntry, CreateTimeEntryDTO } from '@/types/timeEntry';
import { httpClient } from './api';

export async function createTimeEntry(
  projectId: string,
  dto: CreateTimeEntryDTO,
): Promise<TimeEntry> {
  const { data } = await httpClient.post<TimeEntry>(
    `/projects/${projectId}/time-entries`,
    dto,
  );
  return data;
}

export async function getTimeEntries(projectId: string): Promise<TimeEntry[]> {
  const { data } = await httpClient.get<TimeEntry[]>(
    `/projects/${projectId}/time-entries`,
  );
  return data;
}
