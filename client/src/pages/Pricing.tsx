import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap, Check } from 'lucide-react';

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      setLocation('/checkout');
    } else {
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 border-b flex items-center px-4 sticky top-0 bg-background z-10 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/')}
          data-testid="button-back"
          className="hover-elevate"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold">Pricing</h1>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-bold">Simple, Pay-As-You-Go Pricing</h1>
            <p className="text-muted-foreground">
              Only pay for what you use. No subscriptions, no commitments.
            </p>
          </div>

          <Card className="p-8 border-2 border-primary relative overflow-hidden">
            <Badge className="absolute top-4 right-4" data-testid="badge-popular">
              <Zap className="h-3 w-3 mr-1" />
              Popular
            </Badge>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Credit Pack</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$5</span>
                  <span className="text-muted-foreground">one-time</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Query credits for AI recommendations</p>
                    <p className="text-sm text-muted-foreground">Get personalized gift suggestions</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Unlimited profiles</p>
                    <p className="text-sm text-muted-foreground">Create profiles for everyone</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Chat history saved</p>
                    <p className="text-sm text-muted-foreground">Access past conversations anytime</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Character limit per message</p>
                    <p className="text-sm text-muted-foreground">Up to 5,000 characters</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGetStarted}
                className="w-full h-12 text-base hover-elevate active-elevate-2"
                data-testid="button-get-started"
              >
                {user ? 'Buy Credits' : 'Get Started'}
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-muted/50">
            <h3 className="font-semibold mb-3">How Credits Work</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Each AI query costs 1 credit</p>
              <p>• Credits never expire</p>
              <p>• Buy more credits anytime you need them</p>
              <p>• No hidden fees or recurring charges</p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
