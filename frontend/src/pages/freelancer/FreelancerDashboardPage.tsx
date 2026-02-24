import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, LayoutDashboard, LogOut, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AssignedProjectCard } from '@/components/freelancer/AssignedProjectCard';
import { useAssignedProjects } from '@/hooks/useProjects';
import { useSubmittedBidProjects } from '@/hooks/useBids';
import { useAuth } from '@/contexts/AuthContext';

function StatCard({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: string | number;
  isLoading: boolean;
}): React.ReactElement {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function FreelancerDashboardPage(): React.ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: projectsData, isLoading, isError } = useAssignedProjects(user?.id ?? '');
  const { data: submittedProjectIds = [] } = useSubmittedBidProjects();

  async function handleLogout(): Promise<void> {
    await logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  }

  const assignedProjects = projectsData?.data ?? [];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 border-r flex-col shrink-0">
        <div className="px-4 py-5 border-b">
          <span className="font-semibold text-sm">Freelancer</span>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {user?.firstName} {user?.lastName}
          </p>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <Link
            to="/freelancer/dashboard"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium bg-accent text-accent-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            to="/freelancer/projects"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Search className="h-4 w-4" />
            Browse Projects
          </Link>
        </nav>

        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-6 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <Link to="/freelancer/projects">
            <Button size="sm" className="gap-1.5">
              <Search className="h-4 w-4" />
              Find Work
            </Button>
          </Link>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Active Projects"
              value={assignedProjects.filter((p) => p.status === 'IN_PROGRESS').length}
              isLoading={isLoading}
            />
            <StatCard
              label="Bids Submitted"
              value={submittedProjectIds.length}
              isLoading={false}
            />
            <StatCard
              label="Total Assigned"
              value={projectsData?.total ?? 0}
              isLoading={isLoading}
            />
          </div>

          {/* Assigned projects */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">Assigned Projects</h2>
              {assignedProjects.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {assignedProjects.length} project{assignedProjects.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {isError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Failed to load assigned projects. Please refresh.
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-1/3 mt-1" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : assignedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
                <Briefcase className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">No assigned projects yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Browse open projects and submit bids to get started
                </p>
                <Link to="/freelancer/projects" className="mt-4">
                  <Button variant="outline">Browse Projects</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedProjects.map((project) => (
                  <AssignedProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
