import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const WELCOME_DIALOG_KEY = 'xzalted-welcome-shown';

export function WelcomeDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasShown = localStorage.getItem(WELCOME_DIALOG_KEY);
    if (!hasShown) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(WELCOME_DIALOG_KEY, 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-welcome">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Welcome to the Xzalted Experience.
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-4 text-base leading-relaxed">
            <p>
              Finding the perfect gift shouldn't feel impossible.
            </p>
            <p>
              Create a profile to build wishlists (free)— or try our premium questionnaire for instant, thoughtful suggestions that actually fit the person you're shopping for.
            </p>
            <p className="font-medium">
              It's fast, genuine, and surprisingly inspiring.
            </p>
            <p className="text-sm italic">
              ✨ Check back often — new updates and features are always on the way.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleClose}
            data-testid="button-welcome-close"
            className="hover-elevate active-elevate-2"
          >
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
