export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type BidRankBy = 'price' | 'rating' | 'composite';

export interface Bid {
  id: string;
  projectId: string;
  freelancerId: string;
  proposedRate: number;
  estimatedDurationDays: number;
  coverLetter: string;
  status: BidStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBidDTO {
  proposedRate: number;
  estimatedDurationDays: number;
  coverLetter: string;
}
