import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { OpenAPI } from './api';


if (import.meta.env.VITE_API_KEY) {
  OpenAPI.BASE = import.meta.env.VITE_API_URL;
} else {
  console.warn('Warning: VITE_API_KEY is not set in the environment variables. Using default API URL.');
  OpenAPI.BASE = 'http://127.0.0.1:8000';
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
