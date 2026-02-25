import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectMilestones } from '@/components/freelancer/ProjectMilestones';
import { LogTimeToggle } from '@/components/freelancer/LogTimeForm';
import { BidList } from '@/components/project/BidList';
import { BidForm } from '@/components/project/BidForm';
import { CreateMilestoneForm } from '@/components/project/CreateMilestoneForm';
import { TimeEntryList } from '@/components/project/TimeEntryList';
import { useAuth } from '@/contexts/AuthContext';
import { useProject, useUpdateProjectStatus } from '@/hooks/useProjects';
import { UserRole } from '@/types/auth';
import type { Project, ProjectStatus, ProjectType } from '@/types/domain';

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

function statusBadgeVariant(
  status: ProjectStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'OPEN': return 'default';
    case 'IN_PROGRESS': return 'secondary';
    case 'REVIEW': return 'default';
    case 'COMPLETED': return 'outline';
    case 'DISPUTED': return 'destructive';
    case 'CANCELLED': return 'destructive';
    default: return 'outline';
  }
}

function typeBadgeLabel(type: ProjectType): string {
  return type === 'FIXED' ? 'Fixed Price' : 'Hourly';
}

// ─── Tab definitions ─────────────────────────────────────────────────────────

type TabId = 'overview' | 'bids' | 'milestones' | 'timelog';

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  bids: 'Bids',
  milestones: 'Milestones',
  timelog: 'Time Log',
};

function getVisibleTabs(project: Project): TabId[] {
  const tabs: TabId[] = ['overview'];

  if (project.status === 'OPEN') {
    tabs.push('bids');
  }

  if (['IN_PROGRESS', 'REVIEW', 'COMPLETED'].includes(project.status)) {
    tabs.push('milestones');
  }

  if (
    project.projectType === 'HOURLY' &&
    ['IN_PROGRESS', 'REVIEW', 'COMPLETED'].includes(project.status)
  ) {
    tabs.push('timelog');
  }

  return tabs;
}

// ─── Status transition machine ───────────────────────────────────────────────

const STATUS_TRANSITIONS: Partial<
  Record<ProjectStatus, { label: string; targetStatus: ProjectStatus }>
> = {
  DRAFT: { label: 'Publish Project', targetStatus: 'OPEN' },
  OPEN: { label: 'Start Project', targetStatus: 'IN_PROGRESS' },
  IN_PROGRESS: { label: 'Mark Complete', targetStatus: 'COMPLETED' },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProjectDetailSkeleton(): React.ReactElement {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-4 w-20" />
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
      </div>
      <div className="flex gap-2 border-b pb-0">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-24" />)}
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function ProjectDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: project, isLoading, isError } = useProject(id ?? '');
  const updateStatus = useUpdateProjectStatus(id ?? '');

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const visibleTabs = project ? getVisibleTabs(project) : (['overview'] as TabId[]);

  // Reset active tab if it becomes hidden after a status change
  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab('overview');
    }
  }, [visibleTabs, activeTab]);

  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (isError || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
        <h1 className="text-xl font-semibold">Project not found</h1>
        <p className="text-sm text-muted-foreground">
          This project does not exist or you do not have access to it.
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const isClientOwner =
    user?.role === UserRole.CLIENT && user.id === project.clientId;
  const isFreelancer = user?.role === UserRole.FREELANCER;

  const transition = STATUS_TRANSITIONS[project.status];

  async function handleStatusTransition(): Promise<void> {
    if (!transition) return;
    try {
      await updateStatus.mutateAsync({ status: transition.targetStatus });
      toast.success(
        transition.targetStatus === 'OPEN'
          ? 'Project published successfully'
          : 'Project marked as complete',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update project status');
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
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
          <h1 className="text-2xl font-bold flex-1">{project.title}</h1>
          <Badge variant={statusBadgeVariant(project.status)} className="shrink-0">
            {project.status.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className="shrink-0">
            {typeBadgeLabel(project.projectType)}
          </Badge>
        </div>

        <p className="text-muted-foreground leading-relaxed">{project.description}</p>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
          <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Budget</p>
            <p className="text-sm font-medium">
              {formatCurrency(project.budgetMin)} – {formatCurrency(project.budgetMax)}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Deadline</p>
            <p className="text-sm font-medium">{formatDate(project.deadline)}</p>
          </div>

          <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Agreed Rate</p>
            <p className="text-sm font-medium">
              {project.agreedRate != null ? `${formatCurrency(project.agreedRate)}/hr` : '—'}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Freelancer</p>
            <p className="text-sm font-medium font-mono">
              {project.freelancerId ? `${project.freelancerId.slice(0, 8)}…` : 'Unassigned'}
            </p>
          </div>
        </div>
      </div>

      {/* Status transition controls — client owner only */}
      {isClientOwner && transition && (
        <>
          <Separator />
          <div className="flex items-center gap-3">
            <Button
              onClick={handleStatusTransition}
              disabled={updateStatus.isPending}
              size="sm"
            >
              {updateStatus.isPending ? 'Updating…' : transition.label}
            </Button>
            <p className="text-xs text-muted-foreground">
              {transition.targetStatus === 'OPEN'
                ? 'Make this project visible to freelancers.'
                : 'Mark this project as finished.'}
            </p>
          </div>
        </>
      )}

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
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Project Details
            </h2>
            <div className="rounded-lg border bg-card p-4 space-y-3">
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

              {project.bidCount != null && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Bids</p>
                  <p className="text-sm font-medium">{project.bidCount}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bids */}
        {activeTab === 'bids' && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {isClientOwner ? 'Received Bids' : 'Submit a Bid'}
            </h2>
            {isClientOwner && user?.id === project.clientId && (
              <BidList projectId={project.id} />
            )}
            {isFreelancer && !project.freelancerId && <BidForm project={project} />}
          </div>
        )}

        {/* Milestones */}
        {activeTab === 'milestones' && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Milestones
            </h2>
            <ProjectMilestones projectId={project.id} />
            {isClientOwner && (
              <CreateMilestoneForm
                projectId={project.id}
                nextOrder={Array.isArray((project as any).milestones) ? (project as any).milestones.length + 1 : 1}
              />
            )}
          </div>
        )}

        {/* Time Log */}
        {activeTab === 'timelog' && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Time Log
            </h2>
            <TimeEntryList projectId={project.id} />
            {isFreelancer &&
              project.status === 'IN_PROGRESS' &&
              project.freelancerId === user?.id && (
                <LogTimeToggle projectId={project.id} />
              )}
          </div>
        )}
      </div>
    </div>
  );
}
