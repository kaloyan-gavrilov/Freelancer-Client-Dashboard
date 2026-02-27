import React, { useEffect, useState } from 'react';
import { httpClient } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAcceptBid, useRejectBid } from '@/hooks/useBids';
import type { Bid, BidRankBy } from '@/types/domain';

interface BidWithFreelancer extends Bid {
  freelancer?: { name?: string; rating?: number };
  rateType?: string;
}

interface Props {
  projectId: string;
  userRole: string | null | undefined;
  projectStatus: string | null | undefined;
}

export function BidList({ projectId, userRole, projectStatus }: Props): React.ReactElement | null {
  const [rankBy, setRankBy] = useState<BidRankBy>('composite');
  const [bids, setBids] = useState<BidWithFreelancer[] | null>(null);

  const acceptBid = useAcceptBid(projectId);
  const rejectBid = useRejectBid(projectId);

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    void httpClient
      .get<BidWithFreelancer[]>(`/projects/${projectId}/bids?rankBy=${rankBy}`)
      .then((res) => {
        if (!mounted) return;
        setBids(res.data);
      })
      .catch(() => {
        if (!mounted) return;
        setBids([]);
      });
    return () => {
      mounted = false;
    };
  }, [projectId, rankBy]);

  // Only visible to clients when project is OPEN
  if (userRole !== 'CLIENT' || projectStatus !== 'OPEN') return null;

  const isPending = acceptBid.isPending || rejectBid.isPending;

  async function handleAccept(bidId: string, name?: string) {
    const confirmed = window.confirm(
      `Accept this bid from ${name ?? bidId.slice(0, 8)}? All other pending bids will be automatically rejected.`,
    );
    if (!confirmed) return;

    try {
      await acceptBid.mutateAsync({ bidId });
      // backend transitions project to IN_PROGRESS — refresh to show new status
      window.location.reload();
    } catch (err) {
      // no-op — hooks already surface errors via toast in other components
      // but keep console for debugging
      // eslint-disable-next-line no-console
      console.error('Failed to accept bid', err);
    }
  }

  async function handleReject(bidId: string) {
    try {
      await rejectBid.mutateAsync({ bidId });
      // optimistic local update to show rejected badge and disable buttons
      setBids((prev) => prev?.map((b) => (b.id === bidId ? { ...b, status: 'REJECTED' } : b)) ?? null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to reject bid', err);
    }
  }

  if (bids === null) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (bids.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No bids submitted yet.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Rank by</label>
        <select
          value={rankBy}
          onChange={(e) => setRankBy(e.target.value as BidRankBy)}
          className="rounded-md border px-2 py-1 text-sm"
        >
          <option value="price">Sort by Price (lowest first)</option>
          <option value="rating">Sort by Rating (highest first)</option>
          <option value="composite">Composite Score (recommended)</option>
        </select>
      </div>

      <ul className="space-y-3">
        {bids.map((bid) => {
          const freelancerName = bid.freelancer?.name ?? bid.freelancerId?.slice(0, 8);
          const freelancerRating = bid.freelancer?.rating;
          return (
            <li key={bid.id} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground font-mono">{freelancerName} </p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium">${bid.proposedRate}{' '}{bid.rateType === 'HOURLY' ? '/hr' : ''}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{bid.estimatedDurationDays} days</span>
                    {typeof freelancerRating === 'number' && (
                      <span className="text-sm text-muted-foreground">· ⭐ {freelancerRating}</span>
                    )}
                  </div>
                </div>

                <Badge variant={bid.status === 'REJECTED' ? 'destructive' : bid.status === 'ACCEPTED' ? 'default' : 'secondary'} className="shrink-0 text-xs">
                  {bid.status}
                </Badge>
              </div>

              <details>
                <summary className="cursor-pointer text-sm font-medium">Cover Letter</summary>
                <p className="text-sm text-muted-foreground mt-2">{bid.coverLetter}</p>
              </details>

              {bid.status === 'PENDING' && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => void handleAccept(bid.id, freelancerName as string)} disabled={isPending}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void handleReject(bid.id)} disabled={isPending}>
                    Reject
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default BidList;
