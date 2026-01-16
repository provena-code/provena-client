import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { OpenAPI } from './api';

console.log(import.meta.env);
if (import.meta.env.VITE_API_URL) {
  OpenAPI.BASE = import.meta.env.VITE_API_URL;
} else {
  console.warn('Warning: VITE_API_KEY is not set in the environment variables. Using default API URL.');
  OpenAPI.BASE = 'http://127.0.0.1:8001';
}

// TODO: We don't really want this to be at compile level (visible in source)
// We want this to be provided by the user at runtime
if (import.meta.env.VITE_API_KEY) {
  OpenAPI.HEADERS = {
    'X-API-KEY': import.meta.env.VITE_API_KEY,
  };
  console.log('API Key set from environment variables.');
} else {
  console.warn('Warning: VITE_API_KEY is not set in the environment variables. Requests may be unauthorized.');
}



const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
