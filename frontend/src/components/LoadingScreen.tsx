import { Briefcase, Loader2 } from 'lucide-react';

export function LoadingScreen(): React.ReactElement {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight">WorkSpace</span>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
