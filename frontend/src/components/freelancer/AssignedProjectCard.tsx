import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectMilestones } from './ProjectMilestones';
import { LogTimeToggle } from './LogTimeForm';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import type { Project, ProjectStatus } from '@/types/domain';

function statusBadgeVariant(
  status: ProjectStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'IN_PROGRESS':
      return 'secondary';
    case 'REVIEW':
      return 'default';
    case 'COMPLETED':
      return 'outline';
    case 'DISPUTED':
      return 'destructive';
    default:
      return 'outline';
  }
}

function statusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'REVIEW':
      return 'In Review';
    default:
      return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');
  }
}

function TotalHours({ projectId }: { projectId: string }): React.ReactElement {
  const { data: entries, isLoading } = useTimeEntries(projectId);

  if (isLoading) return <Skeleton className="h-4 w-16 inline-block" />;

  const total = (entries ?? []).reduce((sum, e) => sum + e.hours, 0);
  return <span>{total.toFixed(1)} hrs logged</span>;
}

interface AssignedProjectCardProps {
  project: Project;
}

export function AssignedProjectCard({ project }: AssignedProjectCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const isActive = project.status === 'IN_PROGRESS';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold leading-tight">
              {project.title}
            </CardTitle>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <TotalHours projectId={project.id} />
            </div>
          </div>
          <Badge variant={statusBadgeVariant(project.status)} className="shrink-0">
            {statusLabel(project.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 h-8 text-xs px-2"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Hide milestones
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> Show milestones
              </>
            )}
          </Button>

          {isActive && <LogTimeToggle projectId={project.id} />}
        </div>

        {expanded && <ProjectMilestones projectId={project.id} />}
      </CardContent>
    </Card>
  );
}
