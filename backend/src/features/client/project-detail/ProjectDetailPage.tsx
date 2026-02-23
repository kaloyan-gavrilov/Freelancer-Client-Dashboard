import { useProjectDetail } from './useProjectDetail';
import { BidList } from './BidList';
import { MilestoneList } from './MilestoneList';
import { StatusStepper } from './StatusStepper';
import { useUpdateProjectStatus } from './useUpdateProjectStatus';
import { Project } from '@/types/project.types';

type Props = {
  projectId: string;
};

export function ProjectDetailPage({ projectId }: Props) {
  const { data: project, isLoading } = useProjectDetail(projectId);
  const { mutate: updateStatus } = useUpdateProjectStatus();

  if (isLoading || !project) return <p>Loading...</p>;

  return (
    <div>
      <h1>{project.title}</h1>
      <StatusStepper status={project.status} />
      <MilestoneList milestones={project.milestones} />
      <BidList bids={project.bids} />
      <button
        disabled={!project.canTransition}
        onClick={() => updateStatus({ id: project.id, nextStatus: project.nextStatus })}
      >
        {project.nextStatusLabel}
      </button>
    </div>
  );
}
