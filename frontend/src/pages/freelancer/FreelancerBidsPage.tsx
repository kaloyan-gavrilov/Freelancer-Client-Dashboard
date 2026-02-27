import { Link } from 'react-router-dom';
import { FileText, CalendarDays, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyBids } from '@/hooks/useBids';
import { useProject } from '@/hooks/useProjects';
import type { Bid, BidStatus } from '@/types/domain';
import { cn } from '@/lib/utils';

function statusMeta(status: BidStatus): { label: string; className: string } {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' };
    case 'ACCEPTED':
      return { label: 'Accepted', className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' };
    case 'REJECTED':
      return { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/20' };
    case 'WITHDRAWN':
      return { label: 'Withdrawn', className: 'bg-muted text-muted-foreground border-muted-foreground/30' };
    default:
      return { label: status, className: '' };
  }
}

function BidCard({ bid }: { bid: Bid }) {
  const { data: project } = useProject(bid.projectId);
  const submittedAt = new Date(bid.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const { label, className } = statusMeta(bid.status);

  return (
    <Link
      to={`/projects/${bid.projectId}`}
      className="block rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {project?.title ?? `Project #${bid.projectId.slice(0, 8)}`}
          </p>
          {bid.coverLetter && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{bid.coverLetter}</p>
          )}
        </div>
        <Badge variant="outline" className={cn('shrink-0 text-xs font-medium', className)}>
          {label}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          ${bid.proposedRate.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          {bid.estimatedDurationDays} days
        </span>
        <span className="text-[11px]">Submitted {submittedAt}</span>
      </div>
    </Link>
  );
}

function BidCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function FreelancerBidsPage(): React.ReactElement {
  const { data: bids = [], isLoading, isError, error } = useMyBids();

  const counts = {
    pending: bids.filter((b) => b.status === 'PENDING').length,
    accepted: bids.filter((b) => b.status === 'ACCEPTED').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Summary */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span>{bids.length} total bid{bids.length !== 1 ? 's' : ''}</span>
        {counts.pending > 0 && <span>· {counts.pending} pending</span>}
        {counts.accepted > 0 && <span>· {counts.accepted} accepted</span>}
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive space-y-1">
          <p className="font-medium">Failed to load bids.</p>
          {error instanceof Error && <p className="opacity-80">{error.message}</p>}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <BidCardSkeleton key={i} />)}
        </div>
      ) : bids.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No bids submitted yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Browse open projects and submit a bid to get started.
          </p>
          <Link to="/freelancer/projects" className="mt-4 text-sm font-medium underline underline-offset-4">
            Browse projects
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bids.map((bid) => (
            <BidCard key={bid.id} bid={bid} />
          ))}
        </div>
      )}
    </div>
  );
}
