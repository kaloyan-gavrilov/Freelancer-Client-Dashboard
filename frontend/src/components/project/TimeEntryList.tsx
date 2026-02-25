import { Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTimeEntries } from '@/hooks/useTimeEntries';

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr));
}

interface TimeEntryListProps {
  projectId: string;
}

export function TimeEntryList({ projectId }: TimeEntryListProps): React.ReactElement {
  const { data: entries, isLoading, isError } = useTimeEntries(projectId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>Total: {totalHours.toFixed(2)} hrs</span>
      </div>

      <ul className="space-y-2">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="rounded-lg border bg-card px-4 py-3 flex items-start gap-4"
          >
            <div className="shrink-0 text-right min-w-[3rem]">
              <span className="text-sm font-medium">{entry.hours}h</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{entry.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatDate(entry.date)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
