import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ApiKeyModalProps {
  open: boolean;
  onApiKeySubmit: (apiKey: string) => void;
  loading: boolean;
  error: string | null;
}

export default function ApiKeyModal({ open, onApiKeySubmit, loading, error }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = () => {
    if (apiKey) {
      onApiKeySubmit(apiKey);
    }
  };

  return (
    <Dialog open={open}>
      <DialogOverlay />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API Key Required</DialogTitle>
          <DialogDescription>
            Please enter your API key to continue. The key will be stored in your browser's local storage.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="api-key"
            placeholder="Your API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={loading}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Verifying...' : 'Save API Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
