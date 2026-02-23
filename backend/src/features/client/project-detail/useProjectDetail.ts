import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(res => res.data),
  });
}
