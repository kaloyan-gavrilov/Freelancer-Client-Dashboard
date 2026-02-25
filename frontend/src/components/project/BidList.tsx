import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBidsForProject, useAcceptBid, useRejectBid } from '@/hooks/useBids';
import type { BidStatus } from '@/types/domain';

function bidStatusVariant(status: BidStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACCEPTED': return 'default';
    case 'PENDING': return 'secondary';
    case 'REJECTED': return 'destructive';
    default: return 'outline';
  }
}

interface BidListProps {
  projectId: string;
}

export function BidList({ projectId }: BidListProps): React.ReactElement {
  const { data: bids, isLoading, isError } = useBidsForProject(projectId);
  const acceptBid = useAcceptBid(projectId);
  const rejectBid = useRejectBid(projectId);

  async function handleAccept(bidId: string): Promise<void> {
    try {
      await acceptBid.mutateAsync({ bidId });
      toast.success('Bid accepted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept bid');
    }
  }

  async function handleReject(bidId: string): Promise<void> {
    try {
      await rejectBid.mutateAsync({ bidId });
      toast.success('Bid rejected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject bid');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">Failed to load bids. Please try again.</p>
    );
  }

  if (!bids || bids.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No bids submitted yet.
      </p>
    );
  }

  const isPending = acceptBid.isPending || rejectBid.isPending;

  return (
    <ul className="space-y-3">
      {bids.map((bid) => (
        <li
          key={bid.id}
          className="rounded-lg border bg-card p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground font-mono">
                {bid.freelancerId.slice(0, 8)}…
              </p>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">${bid.proposedRate}/hr</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{bid.estimatedDurationDays} days</span>
              </div>
            </div>
            <Badge variant={bidStatusVariant(bid.status)} className="shrink-0 text-xs">
              {bid.status}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">{bid.coverLetter}</p>

          {bid.status === 'PENDING' && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => handleAccept(bid.id)}
                disabled={isPending}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(bid.id)}
                disabled={isPending}
              >
                Reject
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
