import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Breadcrumbs from '@/components/breadcrumbs';
import ApiKeyModal from './components/api-key-modal';
import { DefaultService, OpenAPI } from './api';
import { Button } from './components/ui/button';
import { LogOut } from 'lucide-react';
import { ApiError } from './api/core/ApiError';

function App() {
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('provena-api-key'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (apiKey) {
      OpenAPI.HEADERS = { 'X-API-KEY': apiKey };
      localStorage.setItem('provena-api-key', apiKey);
    } else {
      OpenAPI.HEADERS = {};
      localStorage.removeItem('provena-api-key');
    }
  }, [apiKey]);

  const handleApiKeySubmit = async (newApiKey: string) => {
    setLoading(true);
    setError(null);

    // Temporarily set the header for the verification call
    OpenAPI.HEADERS = { 'X-API-KEY': newApiKey };

    try {
      await DefaultService.getAssignmentIDs();
      setApiKey(newApiKey);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setError('Invalid API Key. Please try again.');
      } else {
        setError('An error occurred during verification. Please try again.');
      }
    } finally {
      setLoading(false);
      // Reset headers if the key was invalid, otherwise the effect will handle it
      if (!apiKey) {
        OpenAPI.HEADERS = {};
      }
    }
  };

  const handleLogout = () => {
    setApiKey(null);
  };

  return (
    <div className="container mx-auto p-4">
      {!apiKey ? (
        <ApiKeyModal
          open={!apiKey}
          onApiKeySubmit={handleApiKeySubmit}
          loading={loading}
          error={error}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Clear API Key">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          <Breadcrumbs />
          <Outlet />
        </>
      )}
    </div>
  );
}

export default App;
