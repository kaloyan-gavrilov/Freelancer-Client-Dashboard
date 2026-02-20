import { Injectable } from '@nestjs/common';
import { IBidRepository } from '../../domain/repositories/bid.repository.interface';
import { Bid, BidStatus } from '../../domain/entities/bid.entity';
import { SupabaseClientService } from '../supabase/supabase.client';

type BidRow = {
  id: string;
  project_id: string;
  freelancer_id: string;
  proposed_rate: string;
  estimated_duration_days: number;
  cover_letter: string;
  status: BidStatus;
  created_at: string;
  updated_at: string;
};

function toBid(row: BidRow): Bid {
  return {
    id: row.id,
    projectId: row.project_id,
    freelancerId: row.freelancer_id,
    proposedRate: Number(row.proposed_rate),
    estimatedDurationDays: row.estimated_duration_days,
    coverLetter: row.cover_letter,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

@Injectable()
export class SupabaseBidRepository implements IBidRepository {
  private get db() {
    return this.supabase.client.from('bids');
  }

  constructor(private readonly supabase: SupabaseClientService) {}

  async findById(id: string): Promise<Bid | null> {
    const { data, error } = await this.db
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return toBid(data as BidRow);
  }

  async findByProjectId(projectId: string): Promise<Bid[]> {
    const { data, error } = await this.db
      .select('*')
      .eq('project_id', projectId);

    if (error || !data) return [];
    return (data as BidRow[]).map(toBid);
  }

  async findByFreelancerId(freelancerId: string): Promise<Bid[]> {
    const { data, error } = await this.db
      .select('*')
      .eq('freelancer_id', freelancerId);

    if (error || !data) return [];
    return (data as BidRow[]).map(toBid);
  }

  async findByStatus(status: BidStatus): Promise<Bid[]> {
    const { data, error } = await this.db
      .select('*')
      .eq('status', status);

    if (error || !data) return [];
    return (data as BidRow[]).map(toBid);
  }

  async create(
    input: Omit<Bid, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Bid> {
    const { data, error } = await this.db
      .insert({
        project_id: input.projectId,
        freelancer_id: input.freelancerId,
        proposed_rate: input.proposedRate,
        estimated_duration_days: input.estimatedDurationDays,
        cover_letter: input.coverLetter,
        status: input.status,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to create bid: ${error?.message}`);
    return toBid(data as BidRow);
  }

  async update(
    id: string,
    input: Partial<Omit<Bid, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Bid> {
    const patch: Record<string, unknown> = {};
    if (input.projectId !== undefined) patch['project_id'] = input.projectId;
    if (input.freelancerId !== undefined) patch['freelancer_id'] = input.freelancerId;
    if (input.proposedRate !== undefined) patch['proposed_rate'] = input.proposedRate;
    if (input.estimatedDurationDays !== undefined) patch['estimated_duration_days'] = input.estimatedDurationDays;
    if (input.coverLetter !== undefined) patch['cover_letter'] = input.coverLetter;
    if (input.status !== undefined) patch['status'] = input.status;

    const { data, error } = await this.db
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to update bid: ${error?.message}`);
    return toBid(data as BidRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.delete().eq('id', id);
    if (error) throw new Error(`Failed to delete bid: ${error.message}`);
  }
}
