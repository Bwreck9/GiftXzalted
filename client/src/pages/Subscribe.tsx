// Stripe subscription checkout - referenced from javascript_stripe blueprint
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Check } from 'lucide-react';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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

interface SubscribeFormProps {
  selectedPlan: string;
  onPlanChange: (planId: string) => void;
}

const SubscribeForm = ({ selectedPlan, onPlanChange }: SubscribeFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
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
          {/* Plan Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Select Your Plan</h2>
            <RadioGroup value={selectedPlan} onValueChange={onPlanChange}>
              <div className="space-y-3">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover-elevate ${
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                    onClick={() => onPlanChange(plan.id)}
                    data-testid={`plan-option-${plan.id}`}
                  >
                    <RadioGroupItem
                      value={plan.id}
                      id={plan.id}
                      className="mt-1"
                    />
                    <Label
                      htmlFor={plan.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-lg">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {plan.tokens} tokens/month • {plan.profiles} profiles
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            ${plan.price}
                          </div>
                          <div className="text-sm text-muted-foreground">/month</div>
                        </div>
                      </div>
                      <div className="space-y-1 mt-3">
                        {plan.features.map((feature, idx) => (
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

          {/* Payment Form */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <PaymentElement />
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-medium">Total</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ${plan?.price}/month
                  </span>
                </div>
                <Button
                  type="submit"
                  disabled={!stripe || isProcessing}
                  className="w-full h-12 text-base hover-elevate active-elevate-2"
                  data-testid="button-submit-payment"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                      Processing...
                    </div>
                  ) : (
                    `Subscribe for $${plan?.price}/month`
                  )}
                </Button>
              </div>
            </form>
          </Card>
          
          <div className="text-center text-xs text-muted-foreground px-4">
            <p>Recurring monthly subscription • Cancel anytime</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const abortController = new AbortController();
    let isCurrentRequest = true;

    apiRequest("POST", "/api/create-subscription", { planId: selectedPlan })
      .then((res) => res.json())
      .then((data) => {
        if (isCurrentRequest && !abortController.signal.aborted) {
          setClientSecret(data.clientSecret);
        }
      })
      .catch((error) => {
        if (isCurrentRequest && !abortController.signal.aborted) {
          console.error("Failed to create subscription:", error);
          toast({
            title: "Subscription Setup Failed",
            description: "Unable to initialize subscription. Please try again.",
            variant: "destructive",
          });
          setLocation('/pricing');
        }
      });

    return () => {
      isCurrentRequest = false;
      abortController.abort();
    };
  }, [selectedPlan, setLocation, toast]);

  const handlePlanChange = (newPlan: string) => {
    setSelectedPlan(newPlan);
    // Client secret will be regenerated by useEffect
  };

  if (!clientSecret) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <SubscribeForm selectedPlan={selectedPlan} onPlanChange={handlePlanChange} />
    </Elements>
  );
}
