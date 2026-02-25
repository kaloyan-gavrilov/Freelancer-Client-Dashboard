import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Milestone, CreateMilestoneDTO } from '@/types/domain';

export function useMilestones(projectId: string) {
  return useQuery<Milestone[]>({
    queryKey: ['milestones', projectId],
    queryFn: () => api.get<Milestone[]>(`/projects/${projectId}/milestones`),
    enabled: !!projectId,
  });
}

export function useCreateMilestone(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<Milestone, Error, CreateMilestoneDTO>({
    mutationFn: (dto) => api.post<Milestone>(`/projects/${projectId}/milestones`, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
    },
  });
}
