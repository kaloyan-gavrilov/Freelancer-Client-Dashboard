import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createBid, getMyBids } from '@/services/bidsApi';
import { httpClient } from '@/services/api';
import type { Bid, CreateBidPayload } from '@/types/domain';

export function useMyBids() {
  return useQuery<Bid[]>({
    queryKey: ['my-bids'],
    queryFn: getMyBids,
  });
}

export function useMyBidForProject(projectId: string, freelancerId: string) {
  return useQuery<Bid[]>({
    queryKey: ['my-bids', projectId, freelancerId],
    queryFn: async (): Promise<Bid[]> => {
      // We can't directly filter bids as freelancer — use a project-scoped endpoint
      // The backend GET /projects/:id/bids is CLIENT only, so we store submitted
      // bid IDs in query cache after submission. This query just checks the cache.
      return [];
    },
    enabled: false, // only populated via cache after successful bid
    staleTime: Infinity,
  });
}

/**
 * Track which projects the current freelancer has bid on.
 * Stored locally in query cache — populated on successful bid submission.
 */
export function useSubmittedBidProjects() {
  return useQuery<string[]>({
    queryKey: ['submitted-bid-projects'],
    queryFn: () => Promise.resolve([]),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useSubmitBid(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<Bid, Error, CreateBidPayload>({
    mutationFn: (payload) => createBid(projectId, payload),
    onSuccess: () => {
      // Mark this project as bid-submitted in the local cache
      queryClient.setQueryData<string[]>(['submitted-bid-projects'], (prev = []) => {
        if (prev.includes(projectId)) return prev;
        return [...prev, projectId];
      });
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useBidsForProject(projectId: string, enabled = true) {
  return useQuery<Bid[]>({
    queryKey: ['bids', projectId],
    queryFn: async () => (await httpClient.get<Bid[]>(`/projects/${projectId}/bids`)).data,
    enabled: !!projectId && enabled,
  });
}

export function useAcceptBid(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<Bid, Error, { bidId: string }>({
  mutationFn: async ({ bidId }) => (await httpClient.patch<Bid>(`/bids/${bidId}/accept`)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bids', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useRejectBid(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<Bid, Error, { bidId: string }>({
  mutationFn: async ({ bidId }) => (await httpClient.patch<Bid>(`/bids/${bidId}/reject`)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bids', projectId] });
    },
  });
}
