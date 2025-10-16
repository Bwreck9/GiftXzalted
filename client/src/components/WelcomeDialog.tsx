import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, ListPlus, Search } from 'lucide-react';

const WELCOME_DIALOG_KEY = 'giftspark-welcome-shown';

interface WelcomeDialogProps {
  externalOpen?: boolean;
  onExternalClose?: () => void;
  onGiftTrackerClick?: () => void;
  onTrainAgentClick?: () => void;
  onWebSearchClick?: () => void;
}

export function WelcomeDialog({ externalOpen, onExternalClose, onGiftTrackerClick, onTrainAgentClick, onWebSearchClick }: WelcomeDialogProps) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

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

  const handleGetStarted = () => {
    handleClose();
    setLocation('/onboarding');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[540px] overflow-hidden" data-testid="dialog-welcome">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/10 -z-10" />
        
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
          
          <DialogDescription className="text-center text-base leading-relaxed">
            Your AI-powered gift companion awaits.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 pt-2">
          <button
            onClick={() => {
              onGiftTrackerClick?.();
              handleClose();
            }}
            className="w-full flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10 hover-elevate active-elevate-2 text-left transition-all"
            data-testid="button-gift-tracker"
          >
            <ListPlus className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">Gift Tracker (Free)</span>
              <span className="text-sm text-muted-foreground">Keep track of gift ideas the old school way</span>
            </div>
          </button>
          
          <button
            onClick={() => {
              onTrainAgentClick?.();
              handleClose();
            }}
            className="w-full flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/10 hover-elevate active-elevate-2 text-left transition-all"
            data-testid="button-train-agent"
          >
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">Train an AI agent</span>
              <span className="text-sm text-muted-foreground">Train an AI agent to recommend ideas</span>
            </div>
          </button>
          
          <button
            onClick={() => {
              onWebSearchClick?.();
              handleClose();
            }}
            className="w-full flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-pink-500/5 to-primary/5 border border-pink-500/10 hover-elevate active-elevate-2 text-left transition-all"
            data-testid="button-web-search"
          >
            <Search className="h-5 w-5 text-pink-600 dark:text-pink-400 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">Web Search Agent</span>
              <span className="text-sm text-muted-foreground">Use the agent to search the web for gift ideas</span>
            </div>
          </button>
        </div>
        
        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleGetStarted}
            data-testid="button-welcome-get-started"
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
