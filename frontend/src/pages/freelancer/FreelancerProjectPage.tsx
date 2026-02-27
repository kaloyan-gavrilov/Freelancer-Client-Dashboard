import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, DollarSign, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { MilestoneList } from '@/components/milestones/MilestoneList';
import { TimeEntryList } from '@/components/time/TimeEntryList';
import { TimeEntryForm } from '@/components/time/TimeEntryForm';
import { useProject } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import type { ProjectStatus, ProjectType } from '@/types/domain';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr));
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function statusBadgeVariant(
  status: ProjectStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'IN_PROGRESS': return 'secondary';
    case 'REVIEW':      return 'default';
    case 'COMPLETED':   return 'outline';
    case 'DISPUTED':    return 'destructive';
    case 'CANCELLED':   return 'destructive';
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

function typeLabel(type: ProjectType): string {
  return type === 'FIXED' ? 'Fixed Price' : 'Hourly';
}

// ─── Tab definitions ─────────────────────────────────────────────────────────

type TabId = 'overview' | 'milestones' | 'timelog';

const TAB_LABELS: Record<TabId, string> = {
  overview:   'Overview',
  milestones: 'Milestones',
  timelog:    'Time Log',
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function PageSkeleton(): React.ReactElement {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
      </div>
      <div className="flex gap-2 border-b pb-0">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-24" />)}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function FreelancerProjectPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: project, isLoading, isError } = useProject(id ?? '');

  const activeStatuses: ProjectStatus[] = ['IN_PROGRESS', 'REVIEW', 'COMPLETED'];
  const showMilestones = project ? activeStatuses.includes(project.status) : false;
  const showTimeLog =
    project ? project.projectType === 'HOURLY' && activeStatuses.includes(project.status) : false;

  const defaultTab: TabId = 'overview';
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  const visibleTabs: TabId[] = ['overview'];
  if (showMilestones) visibleTabs.push('milestones');
  if (showTimeLog) visibleTabs.push('timelog');

  // Reset tab if it becomes invisible
  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab('overview');
    }
  }, [visibleTabs, activeTab]);

  if (isLoading) return <PageSkeleton />;

  if (isError || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <h1 className="text-xl font-semibold">Project not found</h1>
        <p className="text-sm text-muted-foreground">
          This project does not exist or you do not have access to it.
        </p>
        <Link to="/freelancer/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const canLogTime =
    user?.role === UserRole.FREELANCER &&
    project.status === 'IN_PROGRESS' &&
    project.freelancerId === user?.id;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-start gap-2">
          <h1 className="text-2xl font-bold flex-1 min-w-0">{project.title}</h1>
          <Badge variant={statusBadgeVariant(project.status)} className="shrink-0">
            {statusLabel(project.status)}
          </Badge>
          <Badge variant="outline" className="shrink-0">
            {typeLabel(project.projectType)}
          </Badge>
        </div>

        <p className="text-muted-foreground leading-relaxed">{project.description}</p>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
          <div className="rounded-lg border bg-muted/30 px-3 py-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {project.agreedRate != null ? 'Agreed Rate' : 'Budget'}
              </p>
            </div>
            <p className="text-sm font-medium">
              {project.agreedRate != null
                ? `${formatCurrency(project.agreedRate)}/hr`
                : `${formatCurrency(project.budgetMin)} – ${formatCurrency(project.budgetMax)}`}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 px-3 py-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Deadline</p>
            </div>
            <p
              className={cn(
                'text-sm font-medium',
                isOverdue(project.deadline) && project.status === 'IN_PROGRESS'
                  ? 'text-destructive'
                  : '',
              )}
            >
              {formatDate(project.deadline)}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 px-3 py-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Type</p>
            </div>
            <p className="text-sm font-medium">{typeLabel(project.projectType)}</p>
          </div>

          <div className="rounded-lg border bg-muted/30 px-3 py-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Status</p>
            </div>
            <p className="text-sm font-medium">{statusLabel(project.status)}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Tab navigation */}
      <nav className="flex gap-1 border-b -mb-2">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div className="pt-2">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm leading-relaxed">{project.description}</p>
              </div>

              {project.skills && project.skills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Required Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {!showMilestones && (
                <p className="text-xs text-muted-foreground italic">
                  Milestones will be available once the project is in progress.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Milestones */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            <MilestoneList projectId={project.id} userRole={UserRole.FREELANCER} />
          </div>
        )}

        {/* Time Log */}
        {activeTab === 'timelog' && (
          <div className="space-y-4">
            <TimeEntryList projectId={project.id} agreedRate={project.agreedRate} />
            {canLogTime && <TimeEntryForm projectId={project.id} />}
          </div>
        )}
      </div>
    </div>
  );
}
