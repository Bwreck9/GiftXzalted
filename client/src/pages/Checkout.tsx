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

      <main className="flex-1 overflow-auto p-4">
        <div className="max-w-md mx-auto space-y-6">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">${totalPrice.toFixed(2)}</h2>
              <p className="text-muted-foreground">{totalTokens.toLocaleString()} query credits for AI recommendations</p>
            </div>

            <div className="mb-8 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Quantity</label>
                  <span className="text-sm text-muted-foreground">{quantity} batch{quantity !== 1 ? 'es' : ''}</span>
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
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>$5 (5K tokens)</span>
                  <span>$100 (100K tokens)</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price per batch</span>
                  <span className="font-medium">${PRICE_PER_BATCH.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tokens per batch</span>
                  <span className="font-medium">{TOKENS_PER_BATCH.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
        </div>
      </main>
    </div>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [, setLocation] = useLocation();

  useEffect(() => {
    apiRequest("POST", "/api/create-payment-intent", { quantity })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch(() => {
        setLocation('/settings');
      });
  }, [quantity, setLocation]);

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    setClientSecret(""); // Reset to show loading while new payment intent is created
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
