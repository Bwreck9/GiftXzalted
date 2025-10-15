import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Gift, Brain, Sparkles, Lock } from 'lucide-react';

export default function About() {
  const [, setLocation] = useLocation();

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
          <h1 className="text-lg font-semibold">About</h1>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2 mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Gift className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Xzalted</h1>
            <p className="text-muted-foreground">
              Personalized gift recommendations made simple
            </p>
          </div>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-3">What is Xzalted?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Xzalted helps you discover the perfect gift for anyone in your life. 
              Create profiles for friends and family, answer a few questions about their 
              personality and interests, and get thoughtful, personalized gift recommendations.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="bg-primary/10 p-3 rounded-lg h-fit">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">1. Create Profiles</h3>
                  <p className="text-sm text-muted-foreground">
                    Build detailed profiles for gift recipients by answering questions 
                    about age, occasion, personality, and interests.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-primary/10 p-3 rounded-lg h-fit">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">2. Chat with AI</h3>
                  <p className="text-sm text-muted-foreground">
                    Ask our AI for gift recommendations. The more context you provide, 
                    the better the suggestions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-primary/10 p-3 rounded-lg h-fit">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">3. Get Recommendations</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive personalized gift ideas tailored to the recipient's profile.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex gap-3 items-start">
              <Lock className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Privacy & Security</h3>
                <p className="text-sm text-muted-foreground">
                  Your profile data is securely stored and only used to provide personalized 
                  recommendations. We never share your information with third parties.
                </p>
              </div>
            </div>
          </Card>

          <div className="text-center pt-4">
            <Button
              onClick={() => setLocation('/pricing')}
              variant="outline"
              data-testid="button-view-pricing"
              className="hover-elevate"
            >
              View Pricing
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
