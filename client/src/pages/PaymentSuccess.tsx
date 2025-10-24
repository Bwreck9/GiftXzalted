import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Give webhook time to process (1 second), then refetch user data
    const refreshTimer = setTimeout(async () => {
      // Force refetch user data to get updated token balance
      await queryClient.refetchQueries({ queryKey: ['/api/auth/user'] });
    }, 1000);
    
    // Redirect after tokens have been refreshed (4 seconds total)
    const redirectTimer = setTimeout(() => {
      setLocation('/settings');
    }, 4000);

    return () => {
      clearTimeout(refreshTimer);
      clearTimeout(redirectTimer);
    };
  }, [setLocation]);

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-background">
      <Card className="p-8 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-full">
            <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your tokens have been added to your account.
          </p>
        </div>

        <Button
          onClick={() => setLocation('/settings')}
          className="w-full hover-elevate active-elevate-2"
          data-testid="button-continue"
        >
          Continue
        </Button>

        <p className="text-sm text-muted-foreground">
          Redirecting automatically...
        </p>
      </Card>
    </div>
  );
}
