import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTimeEntries, createTimeEntry } from '@/services/timeEntriesApi';
import type { TimeEntry, CreateTimeEntryPayload } from '@/types/domain';

export function useTimeEntries(projectId: string) {
  return useQuery<TimeEntry[]>({
    queryKey: ['time-entries', projectId],
    queryFn: () => getTimeEntries(projectId),
    enabled: !!projectId,
  });
}

export function useLogTime(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<TimeEntry, Error, CreateTimeEntryPayload>({
    mutationFn: (payload) => createTimeEntry(projectId, payload),
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: ['time-entries', projectId] });
      const previous = queryClient.getQueryData<TimeEntry[]>(['time-entries', projectId]);

      // Optimistic update
      const optimistic: TimeEntry = {
        id: `optimistic-${Date.now()}`,
        projectId,
        freelancerId: '',
        milestoneId: null,
        ...newEntry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<TimeEntry[]>(['time-entries', projectId], (prev = []) => [
        ...prev,
        optimistic,
      ]);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      const ctx = context as { previous?: TimeEntry[] } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(['time-entries', projectId], ctx.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['time-entries', projectId] });
    },
  });
}
