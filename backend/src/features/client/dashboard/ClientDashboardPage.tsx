import { useClientProjects } from './useClientProjects';
import { ProjectCard } from './ProjectCard';
import { useNavigate } from 'react-router-dom';
import { Project } from '@/types/project.types';

export function ClientDashboardPage() {
  const { data: projects, isLoading, error } = useClientProjects();
  const navigate = useNavigate();

  return (
    <div>
      <h1>My Projects</h1>
      <button onClick={() => navigate('/client/projects/new')}>New Project</button>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error loading projects</p>}
      {projects?.map((project: Project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
