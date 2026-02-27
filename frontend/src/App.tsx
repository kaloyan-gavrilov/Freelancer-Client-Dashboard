import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast, Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ClientDashboard } from './pages/ClientDashboard';
import CreateProjectForm from './components/project/CreateProjectForm';
import { FreelancerDashboardPage } from './pages/freelancer/FreelancerDashboardPage';
import { BrowseProjectsPage } from './pages/freelancer/BrowseProjectsPage';
import { FreelancerBidsPage } from './pages/freelancer/FreelancerBidsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoadingScreen } from './components/LoadingScreen';
import { UserRole } from './types/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
    },
  },
});

function UnauthorizedHandler(): null {
  const navigate = useNavigate();
  const { logout } = useAuth();
  useEffect(() => {
    const handler = () => {
      toast.error('Session expired. Please log in again.');
      void logout();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [navigate, logout]);
  return null;
}

function RootRedirect(): React.ReactNode {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return user.role === UserRole.CLIENT
    ? <Navigate to="/client/dashboard" replace />
    : <Navigate to="/freelancer/dashboard" replace />;
}

export default function App(): React.ReactNode {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <UnauthorizedHandler />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes — require authentication */}
            <Route element={<ProtectedRoute />}>
              {/* Shared routes — accessible to both roles */}
              <Route path="/projects/:id" element={<ProjectDetailPage />} />

              {/* Client routes */}
              <Route element={<RoleRoute allowedRole={UserRole.CLIENT} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/client/dashboard" element={<ClientDashboard />} />
                  <Route path="/client/projects" element={<ClientDashboard />} />
                  <Route path="/client/projects/create" element={<CreateProjectForm />} />
                </Route>
              </Route>

              {/* Freelancer routes */}
              <Route element={<RoleRoute allowedRole={UserRole.FREELANCER} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/freelancer/dashboard" element={<FreelancerDashboardPage />} />
                  <Route path="/freelancer/projects" element={<BrowseProjectsPage />} />
                  <Route path="/freelancer/bids" element={<FreelancerBidsPage />} />
                </Route>
              </Route>
            </Route>

            {/* Root — redirect based on role */}
            <Route path="/" element={<RootRedirect />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
