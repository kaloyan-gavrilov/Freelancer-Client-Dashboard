import { MilestoneRecord, MilestoneStatus } from '../entities/milestone.entity';

export interface IMilestoneRepository {
  findById(id: string): Promise<MilestoneRecord | null>;
  findByProjectId(projectId: string): Promise<MilestoneRecord[]>;
  create(data: Omit<MilestoneRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MilestoneRecord>;
  updateStatus(id: string, status: MilestoneStatus): Promise<MilestoneRecord>;
}

export const MILESTONE_REPOSITORY = Symbol('IMilestoneRepository');
