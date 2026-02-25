import type {
  Project,
  CreateProjectDTO,
  UpdateProjectStatusDTO,
  ProjectQuery,
  PaginatedResponse,
} from '@/types/project';
import { httpClient } from './api';

export async function createProject(dto: CreateProjectDTO): Promise<Project> {
  const { data } = await httpClient.post<Project>('/projects', dto);
  return data;
}

export async function getProjects(
  query: ProjectQuery = {},
): Promise<PaginatedResponse<Project>> {
  const { data } = await httpClient.get<PaginatedResponse<Project>>('/projects', {
    params: query,
  });
  return data;
}

export async function getProjectById(id: string): Promise<Project> {
  const { data } = await httpClient.get<Project>(`/projects/${id}`);
  return data;
}

export async function updateProjectStatus(
  id: string,
  dto: UpdateProjectStatusDTO,
): Promise<Project> {
  const { data } = await httpClient.patch<Project>(`/projects/${id}/status`, dto);
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  await httpClient.delete(`/projects/${id}`);
}
