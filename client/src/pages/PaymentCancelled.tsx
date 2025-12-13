import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function PaymentCancelled() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setLocation('/pricing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setLocation]);

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

        <p className="text-sm text-muted-foreground" data-testid="text-redirect-countdown">
          Redirecting to pricing in {countdown}...
        </p>
      </Card>
    </div>
  );
}
