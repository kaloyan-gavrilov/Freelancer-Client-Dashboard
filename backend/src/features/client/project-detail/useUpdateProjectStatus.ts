import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProjectStatus } from '@/types/project.types';

type UpdateStatusInput = {
  id: string;
  nextStatus: ProjectStatus;
};

export function useUpdateProjectStatus() {
  return useMutation({
    mutationFn: ({ id, nextStatus }: UpdateStatusInput) =>
      api.patch(`/projects/${id}/status`, { status: nextStatus }),
  });
}
