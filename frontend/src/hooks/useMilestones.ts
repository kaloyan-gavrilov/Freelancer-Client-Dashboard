import { useQuery } from '@tanstack/react-query';
import { getMilestones } from '@/services/milestonesApi';
import type { Milestone } from '@/types/domain';

export function useMilestones(projectId: string) {
  return useQuery<Milestone[]>({
    queryKey: ['milestones', projectId],
    queryFn: () => getMilestones(projectId),
    enabled: !!projectId,
  });
}
