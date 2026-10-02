import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { logout, useAuth } from '@/lib/auth';

// Shown when the server rejects the current credential (401) or the user
// lacks instructor access (403). Can't be dismissed: the only way out is to
// log out, after which the protected layout redirects to /login and returns
// here once the user logs back in.
export default function AuthProblemDialog() {
  const { credential, problem } = useAuth();
  if (!credential || !problem) return null;

  let title: string;
  let description: string;
  if (problem === 'insufficient_role') {
    title = 'No instructor access';
    description = credential.kind === 'token'
      ? `You're signed in as ${credential.email}, which doesn't have instructor access on this server. Log out to sign in with a different account.`
      : "This API key doesn't have instructor access on this server.";
  } else if (credential.kind === 'apiKey') {
    title = 'API key rejected';
    description = 'The server no longer accepts this API key. Log out and sign in again to continue.';
  } else {
    title = 'Session expired';
    description = 'Your login is no longer valid. Log out and sign in again to continue.';
  }

  return (
    <Dialog open>
      <DialogContent
        className="sm:max-w-[425px] [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={logout}>Log out and sign in again</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
