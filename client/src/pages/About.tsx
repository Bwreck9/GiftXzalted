import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Gift, ListPlus, Sparkles, Lock, ArrowLeft, Zap } from 'lucide-react';
import { LoginModal } from '@/components/LoginModal';

export default function About() {
  const [, setLocation] = useLocation();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 group"
            aria-label="Gift Xzalted Home"
          >
            <div className="bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-2 rounded-lg">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gift Xzalted
            </span>
          </button>
          
          <Button
            onClick={() => setLocation('/')}
            className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:opacity-90 text-white border-0 shadow-md hover-elevate active-elevate-2"
            data-testid="button-back-home"
            aria-label="Back to Home"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                <div className="relative bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-6 rounded-full">
                  <Gift className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              About Gift Xzalted
            </h1>
            <p className="text-xl text-muted-foreground">
              Helping you find thoughtful gift ideas — fast.
            </p>
          </div>

          {/* Main Description */}
          <Card className="p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5">
            <p className="text-lg leading-relaxed text-foreground">
              Gift Xzalted was built to make gift-giving effortless. Create profiles for the people you care about, 
              save your ideas, or try our premium questionnaire to spark thoughtful suggestions instantly. 
              Whether it's birthdays, holidays, or just-because moments — we're here to inspire your next great gift.
            </p>
          </Card>

          {/* How It Works */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">How It Works</h2>
            
            <div className="grid gap-4">
              <Card className="p-6 hover-elevate transition-all">
                <div className="flex gap-4">
                  <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-xl h-fit">
                    <ListPlus className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">1. Create Free Gift Lists</h3>
                    <p className="text-muted-foreground">
                      Start organizing gift ideas right away. Build lists for anyone, anytime. 
                      It's completely free and helps keep track of gift inspiration as it comes.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover-elevate transition-all">
                <div className="flex gap-4">
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 p-4 rounded-xl h-fit">
                    <Gift className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">2. Build Detailed Profiles</h3>
                    <p className="text-muted-foreground">
                      Create profiles for gift recipients by answering questions about their 
                      age, interests, personality, and the occasion. The more detail, the better!
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover-elevate transition-all">
                <div className="flex gap-4">
                  <div className="bg-gradient-to-br from-pink-500/20 to-pink-500/5 p-4 rounded-xl h-fit">
                    <Sparkles className="h-7 w-7 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">3. Get AI-Powered Suggestions</h3>
                    <p className="text-muted-foreground">
                      Unlock premium features to receive personalized, thoughtful gift recommendations 
                      tailored specifically to each profile you've created.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Updates Section */}
          <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="flex gap-3 items-start">
              <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Always Improving</h3>
                <p className="text-muted-foreground">
                  We're constantly adding new features and seasonal updates. Check back often 
                  to discover new ways to make gift-giving even easier and more delightful.
                </p>
              </div>
            </div>
          </Card>

          {/* Privacy */}
          <Card className="p-6">
            <div className="flex gap-3 items-start">
              <Lock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Privacy & Security</h3>
                <p className="text-sm text-muted-foreground">
                  Your profile data is securely stored and only used to provide personalized 
                  recommendations. We never share your information with third parties. Your trust is our priority.
                </p>
              </div>
            </div>
          </Card>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={() => setLocation('/pricing')}
              className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:opacity-90 text-white border-0 shadow-lg hover-elevate active-elevate-2"
              size="lg"
              data-testid="button-view-pricing"
            >
              View Pricing
            </Button>
            <Button
              onClick={() => setLoginModalOpen(true)}
              variant="outline"
              size="lg"
              className="hover-elevate active-elevate-2"
              data-testid="button-get-started"
            >
              Get Started Free
            </Button>
          </div>

          <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />

          {/* Bottom Back Button */}
          <div className="flex justify-center pt-8">
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              size="lg"
              className="hover-elevate active-elevate-2"
              aria-label="Back to Home"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
