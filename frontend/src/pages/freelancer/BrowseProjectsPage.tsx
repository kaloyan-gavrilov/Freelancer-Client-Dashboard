import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Briefcase, ChevronLeft, ChevronRight, LayoutDashboard, Search, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BidModal } from '@/components/freelancer/BidModal';
import { useProjects } from '@/hooks/useProjects';
import { useSubmittedBidProjects } from '@/hooks/useBids';
import type { Project, ProjectFilters } from '@/types/domain';

const PAGE_SIZE = 12;

function ProjectCardSkeleton(): React.ReactElement {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-1" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'OPEN':
      return 'default';
    case 'IN_PROGRESS':
      return 'secondary';
    case 'COMPLETED':
      return 'outline';
    default:
      return 'outline';
  }
}

function formatBudget(min: number, max: number): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  return `${fmt(min)} – ${fmt(max)}`;
}

function formatDeadline(deadline: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(deadline),
  );
}

interface ProjectCardProps {
  project: Project;
  hasBid: boolean;
  onBid: (project: Project) => void;
}

function ProjectCard({ project, hasBid, onBid }: ProjectCardProps): React.ReactElement {
  const skills: string[] = project.skills ?? [];
  const deadlinePast = new Date(project.deadline) < new Date();

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
            {project.title}
          </CardTitle>
          <Badge variant={statusBadgeVariant(project.status)} className="shrink-0">
            {project.status}
          </Badge>
        </div>
        <p className="text-sm font-medium text-primary mt-1">
          {formatBudget(project.budgetMin, project.budgetMax)}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {skills.length > 5 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{skills.length - 5}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className={deadlinePast ? 'text-destructive' : ''}>
            Due {formatDeadline(project.deadline)}
          </span>
          {project.bidCount != null && (
            <span>{project.bidCount} bid{project.bidCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        {hasBid ? (
          <Button variant="outline" className="w-full" disabled>
            Bid submitted
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={() => onBid(project)}
            disabled={project.status !== 'OPEN'}
          >
            Submit Bid
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function BrowseProjectsPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bidTarget, setBidTarget] = useState<Project | null>(null);
  const navigate = useNavigate();

  // Derive filters from URL params
  const page = Number(searchParams.get('page') ?? '1');
  const skillsParam = searchParams.get('skills') ?? '';
  const budgetMinParam = searchParams.get('budgetMin') ?? '';
  const budgetMaxParam = searchParams.get('budgetMax') ?? '';

  // Local draft state for filter inputs
  const [skillsInput, setSkillsInput] = useState(skillsParam);
  const [budgetMinInput, setBudgetMinInput] = useState(budgetMinParam);
  const [budgetMaxInput, setBudgetMaxInput] = useState(budgetMaxParam);

  const filters: ProjectFilters = {
    page,
    limit: PAGE_SIZE,
    skills: skillsParam || undefined,
    budgetMin: budgetMinParam ? Number(budgetMinParam) : undefined,
    budgetMax: budgetMaxParam ? Number(budgetMaxParam) : undefined,
  };

  const { data, isLoading, isError, error } = useProjects(filters);
  const { data: submittedProjectIds = [] } = useSubmittedBidProjects();

  const applyFilters = useCallback(() => {
    const next = new URLSearchParams();
    next.set('page', '1');
    if (skillsInput) next.set('skills', skillsInput);
    if (budgetMinInput) next.set('budgetMin', budgetMinInput);
    if (budgetMaxInput) next.set('budgetMax', budgetMaxInput);
    setSearchParams(next);
  }, [skillsInput, budgetMinInput, budgetMaxInput, setSearchParams]);

  const clearFilters = useCallback(() => {
    setSkillsInput('');
    setBudgetMinInput('');
    setBudgetMaxInput('');
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const goToPage = useCallback(
    (nextPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(nextPage));
        return next;
      });
    },
    [setSearchParams],
  );

  const projects = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = !!(skillsParam || budgetMinParam || budgetMaxParam);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar filters */}
      <aside className="hidden md:flex w-64 border-r flex-col gap-4 p-4 shrink-0 overflow-y-auto">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Skills
          </label>
          <Input
            placeholder="React, Node.js, …"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
          <p className="text-xs text-muted-foreground">Comma-separated</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Budget Range
          </label>
          <Input
            type="number"
            placeholder="Min ($)"
            value={budgetMinInput}
            onChange={(e) => setBudgetMinInput(e.target.value)}
            min={0}
          />
          <Input
            type="number"
            placeholder="Max ($)"
            value={budgetMaxInput}
            onChange={(e) => setBudgetMaxInput(e.target.value)}
            min={0}
          />
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button size="sm" onClick={applyFilters}>
            <Search className="h-3.5 w-3.5 mr-1.5" />
            Apply Filters
          </Button>
          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Browse Projects</h1>
            {!isLoading && (
              <p className="text-xs text-muted-foreground">
                {total} project{total !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasFilters && (
              <Button size="sm" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/freelancer/dashboard')}
              aria-label="Back to dashboard"
              className="gap-1.5"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </header>

        <div className="p-6">
          {isError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error instanceof Error ? error.message : 'Failed to load projects'}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No projects found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasFilters
                  ? 'Try adjusting your filters'
                  : 'Check back later for new opportunities'}
              </p>
              {hasFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    hasBid={submittedProjectIds.includes(project.id)}
                    onBid={setBidTarget}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => goToPage(page + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {bidTarget && (
        <BidModal
          project={bidTarget}
          open={!!bidTarget}
          onOpenChange={(open) => !open && setBidTarget(null)}
        />
      )}
    </div>
  );
}
