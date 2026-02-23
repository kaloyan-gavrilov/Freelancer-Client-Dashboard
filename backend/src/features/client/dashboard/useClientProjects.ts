import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Project } from '@/types/project.types';

export function useClientProjects() {
  return useQuery<Project[]>({
    queryKey: ['client-projects'],
    queryFn: () => api.get('/projects?ownedBy=me').then(res => res.data),
  });
}
