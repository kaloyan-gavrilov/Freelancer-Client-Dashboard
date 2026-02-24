import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Milestone } from '@/types/domain';

export function useMilestones(projectId: string) {
  return useQuery<Milestone[]>({
    queryKey: ['milestones', projectId],
    queryFn: () => api.get<Milestone[]>(`/projects/${projectId}/milestones`),
    enabled: !!projectId,
  });
}
