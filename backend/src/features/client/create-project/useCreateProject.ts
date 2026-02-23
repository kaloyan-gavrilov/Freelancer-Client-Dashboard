import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

type CreateProjectDto = {
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  requiredSkills: string[];
  deadline: string;
};

export function useCreateProject() {
  return useMutation({
    mutationFn: (data: CreateProjectDto) =>
      api.post('/projects', data).then(res => res.data),
  });
}
