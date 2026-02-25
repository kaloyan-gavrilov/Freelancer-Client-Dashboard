import type { Milestone, CreateMilestoneDTO, UpdateMilestoneDTO } from '@/types/milestone';
import { httpClient } from './api';

export async function getMilestones(projectId: string): Promise<Milestone[]> {
  const { data } = await httpClient.get<Milestone[]>(
    `/projects/${projectId}/milestones`,
  );
  return data;
}

export async function createMilestone(
  projectId: string,
  dto: CreateMilestoneDTO,
): Promise<Milestone> {
  const { data } = await httpClient.post<Milestone>(
    `/projects/${projectId}/milestones`,
    dto,
  );
  return data;
}

export async function updateMilestone(
  milestoneId: string,
  dto: UpdateMilestoneDTO,
): Promise<Milestone> {
  const { data } = await httpClient.patch<Milestone>(`/milestones/${milestoneId}`, dto);
  return data;
}
