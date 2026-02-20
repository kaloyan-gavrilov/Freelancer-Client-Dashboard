export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';

export interface Freelancer {
  id: string;
  hourlyRate: number | null;
  availabilityStatus: AvailabilityStatus;
  portfolioUrl: string | null;
  rating: number;
  completedProjectsCount: number;
  onTimeDeliveryRate: number;
  createdAt: Date;
  updatedAt: Date;
}
