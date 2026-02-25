import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase,
  LayoutDashboard,
  FolderOpen,
  Plus,
  Search,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const CLIENT_NAV: NavItem[] = [
  { to: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/client/projects', label: 'My Projects', icon: FolderOpen },
  { to: '/client/projects/create', label: 'Create Project', icon: Plus },
];

const FREELANCER_NAV: NavItem[] = [
  { to: '/freelancer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/freelancer/projects', label: 'Browse Projects', icon: Search },
  { to: '/freelancer/bids', label: 'My Bids', icon: FileText },
];

const PAGE_TITLES: Record<string, string> = {
  '/client/dashboard': 'Dashboard',
  '/client/projects': 'My Projects',
  '/client/projects/create': 'Create Project',
  '/freelancer/dashboard': 'Dashboard',
  '/freelancer/projects': 'Browse Projects',
  '/freelancer/bids': 'My Bids',
};

export function DashboardLayout(): React.ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = user?.role === UserRole.CLIENT ? CLIENT_NAV : FREELANCER_NAV;
  const pageTitle = PAGE_TITLES[pathname] ?? 'Dashboard';

  async function handleLogout(): Promise<void> {
    try {
      await logout();
      queryClient.clear();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  function closeMobile(): void {
    setIsMobileOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-200',
          'md:relative md:inset-auto md:z-auto md:flex md:translate-x-0 md:transition-none',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-sm tracking-tight">WorkSpace</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <Separator />

        {/* Logout */}
        <div className="p-3">
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

      {/* Right side: top bar + content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between shrink-0 border-b bg-background/95 backdrop-blur px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileOpen((prev) => !prev)}
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>

          {/* User info */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-sm text-muted-foreground">
              {user?.firstName} {user?.lastName}
            </span>
            <Badge variant="outline" className="text-xs uppercase tracking-wide">
              {user?.role}
            </Badge>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
