import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Breadcrumbs from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import AuthProblemDialog from '@/features/auth/components/auth-problem-dialog';
import { logout, useAuth } from '@/lib/auth';

// Protected layout for every page except /login and /auth/callback.
function App() {
  const { credential } = useAuth();
  const location = useLocation();

  // Children only mount (and start fetching) once a credential is applied.
  if (!credential) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const identity = credential.kind === 'token' ? (credential.name ?? credential.email) : 'API key';

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        <div className="flex items-center gap-2">
          <span
            className="text-sm text-gray-600"
            title={credential.kind === 'token' ? credential.email : undefined}
          >
            {identity}
          </span>
          <Button variant="ghost" size="icon" onClick={logout} title="Log out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <Breadcrumbs />
      <Outlet />
      <AuthProblemDialog />
    </div>
  );
}

export default App;
