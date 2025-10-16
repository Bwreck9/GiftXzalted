import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, ListPlus, X } from 'lucide-react';

const WELCOME_DIALOG_KEY = 'giftspark-welcome-shown';

interface WelcomeDialogProps {
  externalOpen?: boolean;
  onExternalClose?: () => void;
}

export function WelcomeDialog({ externalOpen, onExternalClose }: WelcomeDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasShown = localStorage.getItem(WELCOME_DIALOG_KEY);
    if (!hasShown) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (externalOpen !== undefined) {
      setOpen(externalOpen);
    }
  }, [externalOpen]);

  const handleClose = () => {
    localStorage.setItem(WELCOME_DIALOG_KEY, 'true');
    setOpen(false);
    onExternalClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[540px] overflow-hidden" data-testid="dialog-welcome">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/10 -z-10" />
        
        {/* X Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-md hover-elevate active-elevate-2 z-10"
          data-testid="button-welcome-close-x"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
        
        <DialogHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-4 rounded-full">
                <Gift className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
          
          <DialogTitle className="text-3xl text-center bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            The Agentic Gift Experience.
          </DialogTitle>
          
          <DialogDescription className="space-y-4 pt-2 text-base leading-relaxed">
            <p className="text-foreground">
              Your AI-powered gift companion awaits.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10">
                <ListPlus className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Gift Tracker (Free)</p>
                  <p className="text-sm text-muted-foreground">Keep track of gift ideas</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/10">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Train an AI agent</p>
                  <p className="text-sm text-muted-foreground">Submit a questionnaire and you'll be on your way</p>
                </div>
              </div>
            </div>
            
            <p className="font-medium text-center text-foreground pt-2">
              It's fast, and surprisingly simple.
            </p>
            
            <p className="text-sm italic text-center text-muted-foreground">
              ✨ Check back often — new updates and features are always on the way.
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleClose}
            data-testid="button-welcome-close"
            className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:opacity-90 transition-opacity text-white border-0 shadow-lg hover-elevate active-elevate-2"
            size="lg"
          >
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
