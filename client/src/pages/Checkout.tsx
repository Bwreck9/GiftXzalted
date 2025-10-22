// Stripe checkout integration - referenced from javascript_stripe blueprint
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft } from 'lucide-react';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PRICE_PER_BATCH = 5;
const TOKENS_PER_BATCH = 5000;

interface CheckoutFormProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

const CheckoutForm = ({ quantity, onQuantityChange }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPrice = quantity * PRICE_PER_BATCH;
  const totalTokens = quantity * TOKENS_PER_BATCH;

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
          onClick={() => setLocation('/settings')}
          data-testid="button-back"
          className="hover-elevate"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold">Buy Credits</h1>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-auto p-4 flex items-center justify-center">
        <div className="w-full max-w-sm space-y-4">
          <Card className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Quantity</label>
                <span className="text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {quantity} × ${PRICE_PER_BATCH}
                </span>
              </div>
              <Slider
                value={[quantity]}
                onValueChange={([value]) => onQuantityChange(value)}
                min={1}
                max={20}
                step={1}
                className="w-full"
                data-testid="slider-quantity"
              />
              
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Total Tokens</span>
                  <span className="text-base font-medium">{totalTokens.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium">Total Price</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <PaymentElement />
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
                  `Pay $${totalPrice.toFixed(2)}`
                )}
              </Button>
            </form>
          </Card>
          
          <div className="text-center text-xs text-muted-foreground px-4">
            <p>One-time purchase • ${PRICE_PER_BATCH} per {TOKENS_PER_BATCH.toLocaleString()} tokens</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const abortController = new AbortController();
    let isCurrentRequest = true;

    apiRequest("POST", "/api/create-payment-intent", { quantity })
      .then((res) => res.json())
      .then((data) => {
        // Only update if this is still the current request
        if (isCurrentRequest && !abortController.signal.aborted) {
          setClientSecret(data.clientSecret);
        }
      })
      .catch((error) => {
        // Only handle errors for current request
        if (isCurrentRequest && !abortController.signal.aborted) {
          console.error("Failed to create payment intent:", error);
          toast({
            title: "Payment Setup Failed",
            description: "Unable to initialize payment. Please try again.",
            variant: "destructive",
          });
          setLocation('/settings');
        }
      });

    // Cleanup: mark request as stale when effect re-runs or unmounts
    return () => {
      isCurrentRequest = false;
      abortController.abort();
    };
  }, [quantity, setLocation, toast]);

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    // Don't reset clientSecret to avoid page blink - let the new payment intent load in background
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
      <CheckoutForm quantity={quantity} onQuantityChange={handleQuantityChange} />
    </Elements>
  );
}
