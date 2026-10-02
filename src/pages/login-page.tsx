import { useState } from 'react';
import { Location, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ApiError, DefaultService } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { applyCredential, setCredential, startServerLogin, useAuth } from '@/lib/auth';

interface LoginLocationState {
  from?: Location;
  error?: string;
}

export default function LoginPage() {
  const { credential } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { from, error: redirectError } = (location.state ?? {}) as LoginLocationState;
  const returnTo = from ? `${from.pathname}${from.search}${from.hash}` : '/';

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  if (credential) {
    return <Navigate to={returnTo} replace />;
  }

  const handleApiKeySubmit = async () => {
    const key = apiKey.trim();
    if (!key) return;
    setVerifying(true);
    setApiKeyError(null);

    // Verify with a direct call (not React Query), so a rejected key shows
    // inline here instead of opening the global auth warning.
    applyCredential({ kind: 'apiKey', apiKey: key });
    try {
      await DefaultService.getAssignmentIDs();
      setCredential({ kind: 'apiKey', apiKey: key });
      navigate(returnTo, { replace: true });
    } catch (e) {
      applyCredential(null);
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setApiKeyError('Invalid API key.');
      } else {
        setApiKeyError("Couldn't reach the server. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Provena</h1>
        <p className="mt-1 text-sm text-gray-600">Sign in to view student coding logs.</p>

        {redirectError && <p className="mt-4 text-sm text-red-600">{redirectError}</p>}

        <Button className="mt-6 w-full" onClick={() => startServerLogin(returnTo)}>
          Sign in
        </Button>

        <div className="mt-6 border-t border-gray-200 pt-4">
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            onClick={() => setShowApiKey((v) => !v)}
            aria-expanded={showApiKey}
          >
            {showApiKey ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Use an API key instead
          </button>

          {showApiKey && (
            <form
              className="mt-3 grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleApiKeySubmit();
              }}
            >
              <Input
                type="password"
                autoComplete="off"
                placeholder="API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={verifying}
                autoFocus
              />
              {apiKeyError && <p className="text-sm text-red-600">{apiKeyError}</p>}
              <Button type="submit" variant="outline" disabled={verifying || !apiKey.trim()}>
                {verifying ? 'Verifying...' : 'Continue'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
