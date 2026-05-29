import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { OpenAPI } from './api';
import appRoutes from './routes';

console.log(import.meta.env);
if (import.meta.env.VITE_API_URL) {
  OpenAPI.BASE = import.meta.env.VITE_API_URL;
} else {
  console.warn('Warning: VITE_API_KEY is not set in the environment variables. Using default API URL.');
  OpenAPI.BASE = 'http://127.0.0.1:8001';
}

let routerBase = '/';
if (import.meta.env.VITE_APP_BASE_PATH) {
  routerBase = import.meta.env.VITE_APP_BASE_PATH;
} else {
  console.warn('Warning: VITE_APP_BASE_PATH is not set in the environment variables. Using default base path "/".');
}

// We want this to be provided by the user at runtime
console.warn('Warning: VITE_API_KEY is not set in the environment variables. Requests may be unauthorized.');


const isDev = process.env.NODE_ENV === 'development';
const queryClient = new QueryClient({
  defaultOptions: {
    // Just load data on page load; assume it's valid for that time period
    queries: {
      refetchOnWindowFocus: false,
      staleTime: isDev ? 0 : Infinity,
    },
  },
});

const router = createBrowserRouter(appRoutes, { basename: routerBase });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
