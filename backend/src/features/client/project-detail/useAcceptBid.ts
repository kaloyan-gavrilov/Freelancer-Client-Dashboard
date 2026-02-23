import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useAcceptBid() {
  return useMutation({
    mutationFn: (bidId: string) => api.patch(`/bids/${bidId}/accept`),
  });
}

export function useRejectBid() {
  return useMutation({
    mutationFn: (bidId: string) => api.patch(`/bids/${bidId}/reject`),
  });
}
