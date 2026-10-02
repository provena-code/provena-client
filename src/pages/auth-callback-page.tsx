import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeServerLogin } from '@/lib/auth';

// The server redirects here after login, with the token in the URL fragment.
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  // completeServerLogin consumes the pending login, so it must run only once.
  // StrictMode runs effects twice in dev, and the second run would otherwise
  // report a state mismatch.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const result = completeServerLogin(window.location.hash);
    // `replace` also takes the token out of the address bar and history.
    if (result.ok) {
      navigate(result.returnTo, { replace: true });
    } else {
      navigate('/login', { replace: true, state: { error: result.error } });
    }
  }, [navigate]);

  return <div className="p-4 text-gray-600">Signing in...</div>;
}
