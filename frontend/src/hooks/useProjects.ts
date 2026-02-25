import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Project, ProjectsResponse, ProjectFilters, UpdateProjectStatusDTO } from '@/types/domain';
import { getProjects, getProjectById } from '@/services/projectsApi';
import { updateMilestone } from '@/services/milestonesApi';

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

export function useUpdateProjectStatus(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, UpdateProjectStatusDTO>({
    mutationFn: (dto) => api.patch<Project>(`/projects/${projectId}/status`, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['assigned-projects'] });
    },
  });
}
