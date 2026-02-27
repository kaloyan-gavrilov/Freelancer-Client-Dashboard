import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import type { Project, ProjectStatus } from '@/types/domain';

function statusBadgeVariant(
  status: ProjectStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'IN_PROGRESS': return 'secondary';
    case 'REVIEW':      return 'default';
    case 'COMPLETED':   return 'outline';
    case 'DISPUTED':    return 'destructive';
    default:            return 'outline';
  }
}

function statusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'IN_PROGRESS': return 'In Progress';
    case 'REVIEW':      return 'In Review';
    default:
      return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');
  }
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr));
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
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold leading-tight truncate">
              {project.title}
            </CardTitle>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {project.description}
              </p>
            )}
          </div>
          <Badge variant={statusBadgeVariant(project.status)} className="shrink-0">
            {statusLabel(project.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <TotalHours projectId={project.id} />
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(project.deadline)}
            </span>
          </div>

          {/* CTA */}
          <Link to={`/freelancer/projects/${project.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              View Project
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
