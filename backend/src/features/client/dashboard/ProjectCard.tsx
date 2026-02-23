import { Project } from '@/types/project.types';

type Props = {
  project: Project;
};

export function ProjectCard({ project }: Props) {
  return (
    <div>
      <h2>{project.title}</h2>
      <span className={`badge ${project.status.toLowerCase()}`}>{project.status}</span>
      <p>{project.bids.length} bids</p>
    </div>
  );
}
