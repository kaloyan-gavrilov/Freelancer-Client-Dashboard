import { Link } from 'react-router-dom';
import {
  Briefcase,
  CircleDot,
  CheckCircle2,
  FolderOpen,
  Plus,
  CalendarDays,
  DollarSign,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import type { Project, ProjectStatus } from '@/types/domain';
import { cn } from '@/lib/utils';

// ── Status badge ────────────────────────────────────────────────────────────

function statusMeta(status: ProjectStatus): { label: string; className: string } {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft', className: 'bg-muted text-muted-foreground border-muted-foreground/30' };
    case 'OPEN':
      return { label: 'Open', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' };
    case 'IN_PROGRESS':
      return { label: 'In Progress', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' };
    case 'REVIEW':
      return { label: 'In Review', className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' };
    case 'COMPLETED':
      return { label: 'Completed', className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' };
    case 'CANCELLED':
      return { label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' };
    default:
      return { label: status, className: '' };
  }
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const { label, className } = statusMeta(status);
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', className)}>
      {label}
    </Badge>
  );
}

// ── Summary stat card ────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const deadline = project.deadline
    ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{project.title}</p>
          {project.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {(project.budgetMin != null || project.budgetMax != null) && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {project.budgetMin != null && project.budgetMax != null
              ? `$${project.budgetMin.toLocaleString()} – $${project.budgetMax.toLocaleString()}`
              : project.budgetMin != null
                ? `From $${project.budgetMin.toLocaleString()}`
                : `Up to $${project.budgetMax!.toLocaleString()}`}
          </span>
        )}
        {deadline && (
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {deadline}
          </span>
        )}
        {project.freelancerId && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Freelancer assigned
          </span>
        )}
        {project.projectType && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide">
            {project.projectType}
          </span>
        )}
      </div>
    </Link>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ClientDashboard(): React.ReactElement {
  const { user } = useAuth();
  const { data, isLoading, isError } = useClientProjects(user?.id ?? '');

  const projects = data?.data ?? [];

  const summary = {
    total: data?.total ?? projects.length,
    open: projects.filter((p) => p.status === 'OPEN').length,
    active: projects.filter((p) => p.status === 'IN_PROGRESS').length,
    completed: projects.filter((p) => p.status === 'COMPLETED').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={summary.total} icon={Briefcase} isLoading={isLoading} />
        <StatCard label="Active" value={summary.active} icon={CircleDot} isLoading={isLoading} />
        <StatCard label="Completed" value={summary.completed} icon={CheckCircle2} isLoading={isLoading} />
        <StatCard label="Open (awaiting bids)" value={summary.open} icon={FolderOpen} isLoading={isLoading} />
      </div>

      {/* Project list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">My Projects</h2>
          <Link to="/client/projects/create">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load projects. Please refresh.
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <ProjectCardSkeleton key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
            <Briefcase className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No projects yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first project to start receiving bids from freelancers.
            </p>
            <Link to="/client/projects/create" className="mt-4">
              <Button>
                <Plus className="h-4 w-4 mr-1.5" />
                Create a Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
