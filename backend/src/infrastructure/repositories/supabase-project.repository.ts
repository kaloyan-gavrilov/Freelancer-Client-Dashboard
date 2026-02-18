import { Injectable } from '@nestjs/common';
import { IProjectRepository } from '../../domain/repositories/project.repository.interface';
import { Project, ProjectStatus } from '../../domain/entities/project.entity';
import { SupabaseClientService } from '../supabase/supabase.client';

type ProjectRow = {
  id: string;
  client_id: string;
  freelancer_id: string | null;
  title: string;
  description: string;
  budget_min: string;
  budget_max: string;
  deadline: string;
  status: ProjectStatus;
  project_type: Project['projectType'];
  agreed_rate: string | null;
  created_at: string;
  updated_at: string;
};

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    clientId: row.client_id,
    freelancerId: row.freelancer_id,
    title: row.title,
    description: row.description,
    budgetMin: Number(row.budget_min),
    budgetMax: Number(row.budget_max),
    deadline: new Date(row.deadline),
    status: row.status,
    projectType: row.project_type,
    agreedRate: row.agreed_rate !== null ? Number(row.agreed_rate) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

@Injectable()
export class SupabaseProjectRepository implements IProjectRepository {
  private get db() {
    return this.supabase.client.from('projects');
  }

  constructor(private readonly supabase: SupabaseClientService) {}

  async findById(id: string): Promise<Project | null> {
    const { data, error } = await this.db
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return toProject(data as ProjectRow);
  }

  async findByClientId(clientId: string): Promise<Project[]> {
    const { data, error } = await this.db
      .select('*')
      .eq('client_id', clientId);

    if (error || !data) return [];
    return (data as ProjectRow[]).map(toProject);
  }

  async findByFreelancerId(freelancerId: string): Promise<Project[]> {
    const { data, error } = await this.db
      .select('*')
      .eq('freelancer_id', freelancerId);

    if (error || !data) return [];
    return (data as ProjectRow[]).map(toProject);
  }

  async findByStatus(status: ProjectStatus): Promise<Project[]> {
    const { data, error } = await this.db
      .select('*')
      .eq('status', status);

    if (error || !data) return [];
    return (data as ProjectRow[]).map(toProject);
  }

  async create(
    input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Project> {
    const { data, error } = await this.db
      .insert({
        client_id: input.clientId,
        freelancer_id: input.freelancerId,
        title: input.title,
        description: input.description,
        budget_min: input.budgetMin,
        budget_max: input.budgetMax,
        deadline: input.deadline.toISOString(),
        status: input.status,
        project_type: input.projectType,
        agreed_rate: input.agreedRate,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to create project: ${error?.message}`);
    return toProject(data as ProjectRow);
  }

  async update(
    id: string,
    input: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Project> {
    const patch: Record<string, unknown> = {};
    if (input.clientId !== undefined) patch['client_id'] = input.clientId;
    if (input.freelancerId !== undefined) patch['freelancer_id'] = input.freelancerId;
    if (input.title !== undefined) patch['title'] = input.title;
    if (input.description !== undefined) patch['description'] = input.description;
    if (input.budgetMin !== undefined) patch['budget_min'] = input.budgetMin;
    if (input.budgetMax !== undefined) patch['budget_max'] = input.budgetMax;
    if (input.deadline !== undefined) patch['deadline'] = input.deadline.toISOString();
    if (input.status !== undefined) patch['status'] = input.status;
    if (input.projectType !== undefined) patch['project_type'] = input.projectType;
    if (input.agreedRate !== undefined) patch['agreed_rate'] = input.agreedRate;

    const { data, error } = await this.db
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to update project: ${error?.message}`);
    return toProject(data as ProjectRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.delete().eq('id', id);
    if (error) throw new Error(`Failed to delete project: ${error.message}`);
  }
}
