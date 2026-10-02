import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api';
import { getAuthState, reportAuthProblem, subscribeAuth } from '@/lib/auth';

function isAuthError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function handleError(error: unknown) {
  if (!isAuthError(error)) return;
  reportAuthProblem(error.status === 401 ? 'reauth_required' : 'insufficient_role');
}

const isDev = process.env.NODE_ENV === 'development';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleError }),
  mutationCache: new MutationCache({ onError: handleError }),
  defaultOptions: {
    // Just load data on page load; assume it's valid for that time period
    queries: {
      refetchOnWindowFocus: false,
      staleTime: isDev ? 0 : Infinity,
      // Retrying won't fix an auth failure, and it would delay the warning dialog.
      retry: (failureCount, error) => !isAuthError(error) && failureCount < 3,
    },
  },
});

// Whenever the credential changes (login, logout), drop all cached data so one
// user never sees another's results. Clearing also silently cancels in-flight
// queries, so their failures don't reach the error handler above.
let lastCredential = getAuthState().credential;
subscribeAuth(() => {
  const { credential } = getAuthState();
  if (credential !== lastCredential) {
    lastCredential = credential;
    queryClient.clear();
  }
});
