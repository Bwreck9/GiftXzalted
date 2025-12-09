import { useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';

const PRICE_PER_BATCH = 5;
const TOKENS_PER_BATCH = 5000;

export default function Checkout() {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const totalPrice = quantity * PRICE_PER_BATCH;
  const totalTokens = quantity * TOKENS_PER_BATCH;

  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/create-checkout-session", { quantity });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Failed to create checkout session:", error);
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
                onValueChange={([value]) => setQuantity(value)}
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

            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full h-12 text-base hover-elevate active-elevate-2"
              data-testid="button-checkout"
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
            <p>One-time purchase • ${PRICE_PER_BATCH} per {TOKENS_PER_BATCH.toLocaleString()} tokens</p>
            <p>Secure checkout powered by Stripe</p>
          </div>
        </div>
      </main>
    </div>
  );
}
