import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, getProjectById } from '@/services/projectsApi';
import { updateMilestone } from '@/services/milestonesApi';
import type { Project, ProjectsResponse, ProjectFilters } from '@/types/domain';

export function useProjects(filters: ProjectFilters) {
  return useQuery<ProjectsResponse>({
    queryKey: ['projects', filters],
    queryFn: () => getProjects({ ...filters, status: 'OPEN' }),
  });
}

export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id),
    enabled: !!id,
  });
}

export function useAssignedProjects(freelancerId: string) {
  return useQuery<ProjectsResponse>({
    queryKey: ['assigned-projects', freelancerId],
    queryFn: () => getProjects({ freelancerId }),
    enabled: !!freelancerId,
  });
}

export function useMilestoneReadyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId }: { milestoneId: string; projectId: string }) =>
      updateMilestone(milestoneId, { status: 'COMPLETED' }),
    onSuccess: (_data, { projectId }) => {
      void queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
    },
  });
}
