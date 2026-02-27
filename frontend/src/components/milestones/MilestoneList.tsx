import { CheckCircle2, Circle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useMilestones, useUpdateMilestoneStatus } from '@/hooks/useMilestones';
import { UserRole } from '@/types/auth';
import type { MilestoneStatus } from '@/types/milestone';

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

function StatusDot({ status }: { status: MilestoneStatus }): React.ReactElement {
  switch (status) {
    case 'APPROVED':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'IN_PROGRESS':
      return (
        <svg viewBox="0 0 20 20" className="h-5 w-5 text-blue-500" aria-hidden="true">
          {/* faint full circle background */}
          <circle cx="10" cy="10" r="8" fill="currentColor" opacity="0.15" />
          {/* solid right half */}
          <path d="M10 2 A8 8 0 0 1 10 18 Z" fill="currentColor" />
          {/* crisp border */}
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'SUBMITTED':
      return <Clock className="h-5 w-5 text-amber-500" />;
    case 'REJECTED':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground/40" />;
  }
}

const STATUS_LABEL: Record<MilestoneStatus, string> = {
  PENDING:     'Pending',
  IN_PROGRESS: 'In Progress',
  SUBMITTED:   'Submitted',
  APPROVED:    'Approved',
  REJECTED:    'Rejected',
};

const STATUS_CLASSES: Record<MilestoneStatus, string> = {
  PENDING:     'bg-gray-100 text-gray-600 border-gray-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  SUBMITTED:   'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED:    'bg-green-50 text-green-700 border-green-200',
  REJECTED:    'bg-red-50 text-red-700 border-red-200',
};

interface MilestoneListProps {
  projectId: string;
  userRole?: UserRole;
}

export function MilestoneList({ projectId, userRole }: MilestoneListProps): React.ReactElement {
  const { data: milestones, isLoading, isError } = useMilestones(projectId);
  const updateStatus = useUpdateMilestoneStatus(projectId);

  async function handleStatusChange(milestoneId: string, status: MilestoneStatus): Promise<void> {
    try {
      await updateStatus.mutateAsync({ milestoneId, status });
      toast.success(`Milestone marked as ${STATUS_LABEL[status]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update milestone');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">Failed to load milestones. Please try again.</p>
    );
  }

  if (!milestones || milestones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No milestones yet.
      </p>
    );
  }

  const sorted = [...milestones].sort((a, b) => a.order - b.order);
  const approvedCount = sorted.filter((m) => m.status === 'APPROVED').length;
  const approvedEarnings = sorted
    .filter((m) => m.status === 'APPROVED')
    .reduce((sum, m) => sum + m.amount, 0);
  const totalEarnings = sorted.reduce((sum, m) => sum + m.amount, 0);
  const progressPct = totalEarnings > 0 ? (approvedEarnings / totalEarnings) * 100 : 0;

  const isPending = updateStatus.isPending;

  return (
    <div className="space-y-5">
      {/* Progress summary */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {approvedCount} of {sorted.length} approved
          </span>
          <span className="font-medium tabular-nums">
            {formatCurrency(approvedEarnings)}{' '}
            <span className="text-muted-foreground font-normal">
              / {formatCurrency(totalEarnings)}
            </span>
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Timeline stepper */}
      <ol>
        {sorted.map((m, idx) => {
          const isLast = idx === sorted.length - 1;

          // Determine which action buttons to show
          const freelancerActions: { label: string; status: MilestoneStatus }[] = [];
          const clientActions: { label: string; status: MilestoneStatus; variant?: 'destructive' }[] = [];

          if (userRole === UserRole.FREELANCER) {
            if (m.status === 'PENDING') {
              freelancerActions.push({ label: 'Start', status: 'IN_PROGRESS' });
            } else if (m.status === 'IN_PROGRESS') {
              freelancerActions.push({ label: 'Submit for Review', status: 'SUBMITTED' });
            }
          }

          if (userRole === UserRole.CLIENT) {
            if (m.status === 'SUBMITTED') {
              clientActions.push({ label: 'Approve', status: 'APPROVED' });
              clientActions.push({ label: 'Reject', status: 'REJECTED', variant: 'destructive' });
            }
          }

          const hasActions = freelancerActions.length > 0 || clientActions.length > 0;

          return (
            <li key={m.id} className="relative flex gap-4">
              {/* Dot + connector line */}
              <div className="flex flex-col items-center">
                <div className="mt-0.5 shrink-0">
                  <StatusDot status={m.status} />
                </div>
                {!isLast && (
                  <div className="w-px flex-1 bg-border mt-1.5 min-h-[2rem]" />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-6'}`}>
                <div className="flex flex-wrap items-start gap-2">
                  <p className="text-sm font-medium leading-tight flex-1 min-w-0 truncate">
                    {m.title}
                  </p>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[m.status]}`}
                  >
                    {STATUS_LABEL[m.status]}
                  </span>
                </div>

                {m.description && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {m.description}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-medium tabular-nums text-foreground/80">
                    {formatCurrency(m.amount)}
                  </span>
                  {m.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      Due {formatDate(m.dueDate)}
                    </span>
                  )}
                </div>

                {hasActions && (
                  <div className="flex items-center gap-2 mt-2">
                    {freelancerActions.map((action) => (
                      <Button
                        key={action.status}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={isPending}
                        onClick={() => handleStatusChange(m.id, action.status)}
                      >
                        {action.label}
                      </Button>
                    ))}
                    {clientActions.map((action) => (
                      <Button
                        key={action.status}
                        size="sm"
                        variant={action.variant === 'destructive' ? 'destructive' : 'default'}
                        className="h-7 text-xs"
                        disabled={isPending}
                        onClick={() => handleStatusChange(m.id, action.status)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
