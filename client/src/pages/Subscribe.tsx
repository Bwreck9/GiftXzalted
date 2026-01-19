import { useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Check, CreditCard, Loader2 } from 'lucide-react';

const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 5,
    tokens: '10,000',
    profiles: 10,
    features: ['10,000 tokens/month', 'Up to 10 profiles', 'Resets monthly'],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 20,
    tokens: '50,000',
    profiles: 20,
    features: ['50,000 tokens/month', 'Up to 20 profiles', 'Best value for power users'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 100,
    tokens: '200,000',
    profiles: 100,
    features: ['200,000 tokens/month', 'Up to 100 profiles', 'For serious gift planners'],
  },
];

export default function Subscribe() {
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);

  const handleSubscribe = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/create-subscription-checkout", { planId: selectedPlan });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Failed to create subscription checkout:", error);
      toast({
        title: "Checkout Failed",
        description: "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 border-b flex items-center px-4 sticky top-0 bg-background z-10 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/pricing')}
          data-testid="button-back"
          className="hover-elevate"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold">Subscribe to Profile Plan</h1>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-auto p-4 flex items-center justify-center">
        <div className="w-full max-w-2xl space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Select Your Plan</h2>
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
              <div className="space-y-3">
                {SUBSCRIPTION_PLANS.map((planOption) => (
                  <div
                    key={planOption.id}
                    className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover-elevate ${
                      selectedPlan === planOption.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                    onClick={() => setSelectedPlan(planOption.id)}
                    data-testid={`plan-option-${planOption.id}`}
                  >
                    <RadioGroupItem
                      value={planOption.id}
                      id={planOption.id}
                      className="mt-1"
                    />
                    <Label
                      htmlFor={planOption.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-lg">{planOption.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {planOption.tokens} tokens/month • {planOption.profiles} profiles
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            ${planOption.price}
                          </div>
                          <div className="text-sm text-muted-foreground">/month</div>
                        </div>
                      </div>
                      <div className="space-y-1 mt-3">
                        {planOption.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Check className="h-3 w-3 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-medium">Monthly Total</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                ${plan?.price}/month
              </span>
            </div>
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full h-12 text-base hover-elevate active-elevate-2"
              data-testid="button-subscribe"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to checkout...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Continue to Payment
                </div>
              )}
            </Button>
          </Card>
          
          <div className="text-center text-xs text-muted-foreground px-4 space-y-1">
            <p>Recurring monthly subscription • Cancel anytime</p>
            <p>Secure checkout powered by Stripe</p>
          </div>
        </div>
      </main>
    </div>
  );
}
