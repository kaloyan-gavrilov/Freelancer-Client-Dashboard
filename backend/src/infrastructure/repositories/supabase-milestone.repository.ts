import { Injectable } from '@nestjs/common';
import { IMilestoneRepository } from '../../domain/repositories/milestone.repository.interface';
import { MilestoneRecord, MilestoneStatus } from '../../domain/entities/milestone.entity';
import { SupabaseClientService } from '../supabase/supabase.client';

type MilestoneRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  amount: string;
  order: number;
  status: MilestoneStatus;
  created_at: string;
  updated_at: string;
};

function toMilestone(row: MilestoneRow): MilestoneRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    amount: Number(row.amount),
    order: row.order,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

@Injectable()
export class SupabaseMilestoneRepository implements IMilestoneRepository {
  private get db() {
    return this.supabase.client.from('milestones');
  }

  constructor(private readonly supabase: SupabaseClientService) {}

  async findById(id: string): Promise<MilestoneRecord | null> {
    const { data, error } = await this.db
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return toMilestone(data as MilestoneRow);
  }

  async findByProjectId(projectId: string): Promise<MilestoneRecord[]> {
    const { data, error } = await this.db
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true });

    if (error || !data) return [];
    return (data as MilestoneRow[]).map(toMilestone);
  }

  async create(
    input: Omit<MilestoneRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<MilestoneRecord> {
    const { data, error } = await this.db
      .insert({
        project_id: input.projectId,
        title: input.title,
        description: input.description,
        amount: input.amount,
        order: input.order,
        status: input.status,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to create milestone: ${error?.message}`);
    return toMilestone(data as MilestoneRow);
  }

  async updateStatus(id: string, status: MilestoneStatus): Promise<MilestoneRecord> {
    const { data, error } = await this.db
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to update milestone: ${error?.message}`);
    return toMilestone(data as MilestoneRow);
  }
}
