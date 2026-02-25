import type { Bid, BidRankBy, CreateBidDTO } from '@/types/bid';
import { httpClient } from './api';

export async function createBid(projectId: string, dto: CreateBidDTO): Promise<Bid> {
  const { data } = await httpClient.post<Bid>(`/projects/${projectId}/bids`, dto);
  return data;
}

export async function getBidsForProject(
  projectId: string,
  rankBy?: BidRankBy,
): Promise<Bid[]> {
  const { data } = await httpClient.get<Bid[]>(`/projects/${projectId}/bids`, {
    params: rankBy ? { rankBy } : undefined,
  });
  return data;
}

export async function acceptBid(bidId: string): Promise<Bid> {
  const { data } = await httpClient.patch<Bid>(`/bids/${bidId}/accept`);
  return data;
}

export async function rejectBid(bidId: string): Promise<Bid> {
  const { data } = await httpClient.patch<Bid>(`/bids/${bidId}/reject`);
  return data;
}
