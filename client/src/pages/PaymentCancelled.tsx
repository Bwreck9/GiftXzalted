import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentCancelled() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-background">
      <Card className="p-8 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-orange-100 dark:bg-orange-900/20 p-4 rounded-full">
            <XCircle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold" data-testid="text-payment-cancelled">Payment Cancelled</h1>
          <p className="text-muted-foreground">
            Your payment was not completed. No charges have been made.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => setLocation('/pricing')}
            className="w-full hover-elevate active-elevate-2"
            data-testid="button-view-pricing"
          >
            View Pricing Options
          </Button>
          
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="w-full hover-elevate active-elevate-2"
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
