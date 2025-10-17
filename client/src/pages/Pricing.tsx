import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Check, Sparkles, ListPlus, ArrowLeft, Eye } from 'lucide-react';
import { PreviewQuestionnaireModal } from '@/components/PreviewQuestionnaireModal';

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      setLocation('/checkout');
    } else {
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PreviewQuestionnaireModal open={showPreview} onClose={() => setShowPreview(false)} />
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Simple, Flexible Pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that works for you. Start free, upgrade when you're ready.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Free Plan */}
            <Card className="p-6 relative">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ListPlus className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-bold">Free</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">$0</span>
                    <span className="text-muted-foreground">forever</span>
                  </div>
                </div>

                <div className="space-y-2 min-h-[180px]">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm">Up to 5 gift profiles</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm">Free gift lists</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm">Manual note-taking</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm">Basic organization</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => setShowPreview(true)}
                    variant="outline"
                    className="w-full hover-elevate active-elevate-2"
                    data-testid="preview-questionnaire-btn"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Questionnaire
                  </Button>
                  <Button
                    onClick={() => setLocation('/')}
                    variant="ghost"
                    className="w-full hover-elevate active-elevate-2"
                    data-testid="button-free-account"
                  >
                    Create Free Account
                  </Button>
                </div>
              </div>
            </Card>

            {/* Basic Token Plan */}
            <Card className="p-6 relative border-2 border-primary">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 border-0">
                Popular
              </Badge>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-bold">Basic Plan</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">$5</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                <div className="space-y-2 min-h-[180px]">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm">Everything in Free</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm"><strong>10,000 tokens/month</strong></p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm">~20 AI generations</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm">Resets monthly</p>
                  </div>
                </div>

                <Button
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white border-0 hover-elevate active-elevate-2"
                  data-testid="button-basic-plan"
                >
                  Buy Profile Plan – $5/mo
                </Button>
              </div>
            </Card>

            {/* Premium Token Plan */}
            <Card className="p-6 relative">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <h3 className="text-xl font-bold">Premium Plan</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">$20</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                <div className="space-y-2 min-h-[180px]">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm">Everything in Basic</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm"><strong>50,000 tokens/month</strong></p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm">~100 AI generations</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm">Best value for power users</p>
                  </div>
                </div>

                <Button
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white border-0 hover-elevate active-elevate-2"
                  data-testid="button-premium-plan"
                >
                  Buy Profile Plan – $20/mo
                </Button>
              </div>
            </Card>
          </div>

          {/* One-Time Token Purchase */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-primary/20">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">Need Tokens Just Once?</h3>
                  <p className="text-muted-foreground">
                    Purchase <strong>5,000 tokens</strong> for a one-time payment. Never expires.
                  </p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <div className="text-3xl font-bold">$5</div>
                  <Button
                    onClick={handleGetStarted}
                    variant="outline"
                    className="hover-elevate active-elevate-2"
                    data-testid="button-buy-tokens"
                  >
                    Buy Premium Tokens
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* How Tokens Work */}
          <Card className="p-6 bg-muted/50">
            <h3 className="font-semibold mb-4 text-lg">How Tokens Work</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p>• Each AI generation uses <strong>500 tokens</strong></p>
                <p>• One-time tokens <strong>never expire</strong></p>
                <p>• Subscription tokens <strong>reset monthly</strong></p>
              </div>
              <div className="space-y-2">
                <p>• No hidden fees or charges</p>
                <p>• Cancel subscription anytime</p>
                <p>• Mix and match plans as needed</p>
              </div>
            </div>
          </Card>

          {/* Bottom Back Button */}
          <div className="flex justify-center pt-4">
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
