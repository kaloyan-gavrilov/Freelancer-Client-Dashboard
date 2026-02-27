import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useMilestones } from '@/hooks/useMilestones';

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr));
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);
}

interface TimeEntryListProps {
  projectId: string;
  agreedRate?: number | null;
}

export function TimeEntryList({ projectId, agreedRate }: TimeEntryListProps): React.ReactElement {
  const { data: entries, isLoading, isError } = useTimeEntries(projectId);
  const { data: milestones } = useMilestones(projectId);

  const milestoneMap = useMemo(() => {
    if (!milestones) return new Map<string, string>();
    return new Map(milestones.map((m) => [m.id, m.title]));
  }, [milestones]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">Failed to load time entries. Please try again.</p>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No time entries logged yet.
      </p>
    );
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const totalCost = agreedRate != null ? totalHours * agreedRate : null;

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 border-b">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Date
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
              Hours
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Description
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
              Milestone
            </th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-muted/20">
              <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground text-xs">
                {formatDate(entry.date)}
              </td>
              <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                {entry.hours}h
              </td>
              <td className="px-3 py-2.5 max-w-[200px] truncate text-xs">
                {entry.description}
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                {entry.milestoneId
                  ? (milestoneMap.get(entry.milestoneId) ?? '—')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot className="bg-muted/40 border-t">
          <tr>
            <td className="px-3 py-2.5" colSpan={1}>
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Total
              </div>
            </td>
            <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
              {totalHours.toFixed(2)}h
            </td>
            <td className="px-3 py-2.5 text-xs" colSpan={2}>
              {totalCost != null && (
                <span className="text-muted-foreground">
                  Cost:{' '}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(totalCost)}
                  </span>
                </span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
