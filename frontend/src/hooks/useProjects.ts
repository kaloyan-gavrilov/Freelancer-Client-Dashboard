import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Project, ProjectsResponse, ProjectFilters, UpdateProjectStatusDTO } from '@/types/domain';

function buildProjectsUrl(filters: ProjectFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.skills) params.set('skills', filters.skills);
  if (filters.budgetMin != null) params.set('budgetMin', String(filters.budgetMin));
  if (filters.budgetMax != null) params.set('budgetMax', String(filters.budgetMax));
  params.set('status', 'OPEN');
  const qs = params.toString();
  return `/projects${qs ? `?${qs}` : ''}`;
}

export function useProjects(filters: ProjectFilters) {
  return useQuery<ProjectsResponse>({
    queryKey: ['projects', filters],
    queryFn: () => api.get<ProjectsResponse>(buildProjectsUrl(filters)),
  });
}

export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => api.get<Project>(`/projects/${id}`),
    enabled: !!id,
  });
}

export function useAssignedProjects(freelancerId: string) {
  return useQuery<ProjectsResponse>({
    queryKey: ['assigned-projects', freelancerId],
    queryFn: () =>
      api.get<ProjectsResponse>(`/projects?freelancerId=${encodeURIComponent(freelancerId)}`),
    enabled: !!freelancerId,
  });
}

export function useMilestoneReadyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId }: { milestoneId: string; projectId: string }) =>
      api.patch(`/milestones/${milestoneId}`, { status: 'COMPLETED' }),
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
