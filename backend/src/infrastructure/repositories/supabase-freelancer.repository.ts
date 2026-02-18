import { Injectable } from '@nestjs/common';
import { IFreelancerRepository } from '../../domain/repositories/freelancer.repository.interface';
import { Freelancer, AvailabilityStatus } from '../../domain/entities/freelancer.entity';
import { SupabaseClientService } from '../supabase/supabase.client';

type FreelancerRow = {
  id: string;
  hourly_rate: string | null;
  availability_status: AvailabilityStatus;
  portfolio_url: string | null;
  rating: string;
  completed_projects_count: number;
  on_time_delivery_rate: string;
  created_at: string;
  updated_at: string;
};

function toFreelancer(row: FreelancerRow): Freelancer {
  return {
    id: row.id,
    hourlyRate: row.hourly_rate !== null ? Number(row.hourly_rate) : null,
    availabilityStatus: row.availability_status,
    portfolioUrl: row.portfolio_url,
    rating: Number(row.rating),
    completedProjectsCount: row.completed_projects_count,
    onTimeDeliveryRate: Number(row.on_time_delivery_rate),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

@Injectable()
export class SupabaseFreelancerRepository implements IFreelancerRepository {
  private get db() {
    return this.supabase.client.from('freelancers');
  }

  constructor(private readonly supabase: SupabaseClientService) {}

  async findById(id: string): Promise<Freelancer | null> {
    const { data, error } = await this.db
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return toFreelancer(data as FreelancerRow);
  }

  async findByAvailability(status: AvailabilityStatus): Promise<Freelancer[]> {
    const { data, error } = await this.db
      .select('*')
      .eq('availability_status', status);

    if (error || !data) return [];
    return (data as FreelancerRow[]).map(toFreelancer);
  }

  async create(
    input: Omit<Freelancer, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Freelancer> {
    const { data, error } = await this.db
      .insert({
        hourly_rate: input.hourlyRate,
        availability_status: input.availabilityStatus,
        portfolio_url: input.portfolioUrl,
        rating: input.rating,
        completed_projects_count: input.completedProjectsCount,
        on_time_delivery_rate: input.onTimeDeliveryRate,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to create freelancer: ${error?.message}`);
    return toFreelancer(data as FreelancerRow);
  }

  async update(
    id: string,
    input: Partial<Omit<Freelancer, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Freelancer> {
    const patch: Record<string, unknown> = {};
    if (input.hourlyRate !== undefined) patch['hourly_rate'] = input.hourlyRate;
    if (input.availabilityStatus !== undefined) patch['availability_status'] = input.availabilityStatus;
    if (input.portfolioUrl !== undefined) patch['portfolio_url'] = input.portfolioUrl;
    if (input.rating !== undefined) patch['rating'] = input.rating;
    if (input.completedProjectsCount !== undefined) patch['completed_projects_count'] = input.completedProjectsCount;
    if (input.onTimeDeliveryRate !== undefined) patch['on_time_delivery_rate'] = input.onTimeDeliveryRate;

    const { data, error } = await this.db
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to update freelancer: ${error?.message}`);
    return toFreelancer(data as FreelancerRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.delete().eq('id', id);
    if (error) throw new Error(`Failed to delete freelancer: ${error.message}`);
  }
}
