import { Injectable } from '@nestjs/common';
import { ITimeEntryRepository } from '../../domain/repositories/time-entry.repository.interface';
import { TimeEntry } from '../../domain/entities/time-entry.entity';
import { SupabaseClientService } from '../supabase/supabase.client';

type TimeEntryRow = {
  id: string;
  project_id: string;
  freelancer_id: string;
  milestone_id: string | null;
  hours: string;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
};

function toTimeEntry(row: TimeEntryRow): TimeEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    freelancerId: row.freelancer_id,
    milestoneId: row.milestone_id,
    hours: Number(row.hours),
    description: row.description,
    date: new Date(row.date),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

@Injectable()
export class SupabaseTimeEntryRepository implements ITimeEntryRepository {
  private get db() {
    return this.supabase.client.from('time_entries');
  }

  constructor(private readonly supabase: SupabaseClientService) {}

  async findByProjectId(projectId: string): Promise<TimeEntry[]> {
    const { data, error } = await this.db
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    if (error || !data) return [];
    return (data as TimeEntryRow[]).map(toTimeEntry);
  }

  async create(
    input: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<TimeEntry> {
    const { data, error } = await this.db
      .insert({
        project_id: input.projectId,
        freelancer_id: input.freelancerId,
        milestone_id: input.milestoneId,
        hours: input.hours,
        description: input.description,
        date: input.date.toISOString(),
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to create time entry: ${error?.message}`);
    return toTimeEntry(data as TimeEntryRow);
  }
}
