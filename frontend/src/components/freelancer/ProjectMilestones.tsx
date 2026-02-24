import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMilestones } from '@/hooks/useMilestones';
import { useMilestoneReadyMutation } from '@/hooks/useProjects';
import type { MilestoneStatus } from '@/types/domain';

function milestoneBadgeVariant(
  status: MilestoneStatus,
): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'COMPLETED':
      return 'default';
    case 'IN_PROGRESS':
      return 'secondary';
    default:
      return 'outline';
  }
}

function MilestoneIcon({ status }: { status: MilestoneStatus }): React.ReactElement {
  if (status === 'COMPLETED') return <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />;
  if (status === 'IN_PROGRESS')
    return <Loader2 className="h-4 w-4 text-muted-foreground shrink-0 animate-spin" />;
  return <Circle className="h-4 w-4 text-muted-foreground shrink-0" />;
}

interface ProjectMilestonesProps {
  projectId: string;
}

export function ProjectMilestones({ projectId }: ProjectMilestonesProps): React.ReactElement {
  const { data: milestones, isLoading, isError } = useMilestones(projectId);
  const markReady = useMilestoneReadyMutation();

  async function handleMarkReady(milestoneId: string): Promise<void> {
    try {
      await markReady.mutateAsync({ milestoneId, projectId });
      toast.success('Milestone marked ready for review');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update milestone');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2 mt-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-xs text-destructive mt-2">Failed to load milestones</p>;
  }

  if (!milestones || milestones.length === 0) {
    return <p className="text-xs text-muted-foreground mt-2">No milestones yet</p>;
  }

  return (
    <ul className="space-y-2 mt-2">
      {milestones.map((m) => (
        <li
          key={m.id}
          className="flex items-center gap-2 text-sm rounded-md border px-3 py-2 bg-background"
        >
          <MilestoneIcon status={m.status} />
          <span className="flex-1 truncate">{m.title}</span>
          <Badge variant={milestoneBadgeVariant(m.status)} className="shrink-0 text-xs">
            {m.status.replace('_', ' ')}
          </Badge>
          {m.status === 'IN_PROGRESS' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => handleMarkReady(m.id)}
              disabled={markReady.isPending}
            >
              Mark Ready
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
