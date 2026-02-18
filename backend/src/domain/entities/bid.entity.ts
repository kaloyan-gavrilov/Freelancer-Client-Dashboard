export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Bid {
  id: string;
  projectId: string;
  freelancerId: string;
  proposedRate: number;
  estimatedDurationDays: number;
  coverLetter: string;
  status: BidStatus;
  createdAt: Date;
  updatedAt: Date;
}
