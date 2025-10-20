import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, Phone, ArrowRight } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@shared/schema';

export default function Onboarding() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: profiles } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
    enabled: isAuthenticated,
  });

  const createGiftListMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest('POST', '/api/profiles', { name });
      const newProfile = await response.json() as Profile;
      return newProfile;
    },
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({ title: 'Gift list created successfully' });
      setLocation(`/profile/${newProfile.id}`);
    },
    onError: () => {
      toast({ title: 'Failed to create gift list', variant: 'destructive' });
    },
  });

  const handleGiftTrackerClick = () => {
    // Wait for auth to finish loading before checking authentication
    if (authLoading) return;
    
    if (!isAuthenticated) {
      window.location.href = '/api/login';
      return;
    }
    
    const defaultName = `Gift List ${(profiles?.length || 0) + 1}`;
    createGiftListMutation.mutate(defaultName);
  };

  const handleTrainAgentClick = () => {
    // Wait for auth to finish loading before checking authentication
    if (authLoading) return;
    
    if (!isAuthenticated) {
      window.location.href = '/api/login';
      return;
    }

    if (!user?.tokens || user.tokens <= 0) {
      toast({ 
        title: 'No tokens available', 
        description: 'Purchase tokens to train your AI agent',
        variant: 'destructive' 
      });
      setLocation('/pricing');
      return;
    }

    const defaultName = `AI Profile ${(profiles?.length || 0) + 1}`;
    createGiftListMutation.mutate(defaultName);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5">
      {/* Header */}
      <header className="h-16 border-b bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
        <button 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 hover-elevate active-elevate-2 p-2 rounded-md"
          data-testid="button-back-home"
        >
          <Gift className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Gift Xzalted</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full space-y-12">
          {/* Title */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              How Gift Xzalted Works
            </h1>
            <p className="text-lg text-muted-foreground">
              Your AI-powered gift companion in 3 simple steps
            </p>
          </div>

          {/* Steps */}
          <div className="grid gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    1
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <Gift className="h-6 w-6 text-primary" />
                    <h3 className="text-2xl font-semibold">Create a Profile</h3>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Start with a free gift tracker. Add gift ideas manually and keep track of everything in one place.
                  </p>
                  <Button
                    onClick={handleGiftTrackerClick}
                    disabled={createGiftListMutation.isPending}
                    size="lg"
                    className="hover-elevate active-elevate-2"
                    data-testid="button-step1-gift-tracker"
                  >
                    <Gift className="mr-2 h-5 w-5" />
                    {createGiftListMutation.isPending ? 'Creating...' : 'Start with Gift Tracker'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    2
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-2xl font-semibold">Train Your AI Agent</h3>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Fill out a quick questionnaire about the person you're shopping for. The AI learns their preferences, interests, and style.
                  </p>
                  <Button
                    onClick={handleTrainAgentClick}
                    disabled={createGiftListMutation.isPending}
                    variant="default"
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white hover-elevate active-elevate-2"
                    data-testid="button-step2-train-agent"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    {createGiftListMutation.isPending ? 'Creating...' : 'Train AI Agent'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-primary flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    3
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                    <h3 className="text-2xl font-semibold">Search using your agent</h3>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Get personalized gift recommendations powered by AI. Your agent knows exactly what they'd love.
                  </p>
                  <Button
                    onClick={() => toast({ 
                      title: 'Coming Soon!', 
                      description: 'Web search feature will be available soon. For now, use the AI agent to get recommendations.' 
                    })}
                    variant="outline"
                    size="lg"
                    className="hover-elevate active-elevate-2"
                    data-testid="button-step3-web-search"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Search using your agent
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      <Sparkles className="h-4 w-4" />
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-8">
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              size="lg"
              className="hover-elevate active-elevate-2"
              data-testid="button-back-to-home"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
