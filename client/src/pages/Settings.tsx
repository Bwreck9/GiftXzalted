import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User } from '@shared/schema';
import { ArrowLeft, Coins, LogOut, CreditCard, Smartphone, Share, Crown, AlertTriangle } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  
  const { data: userData } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    setLocation('/');
  };

  const handleBuyCredits = () => {
    setLocation('/checkout');
  };

  const handleInstallPWA = async () => {
    const installed = await promptInstall();
    if (installed) {
      toast({ title: 'App installed successfully!', description: 'Gift Xzalted is now on your home screen.' });
    }
  };

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/stripe/cancel-subscription');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ 
        title: 'Subscription cancelled', 
        description: 'Your subscription will remain active until the end of the billing period.' 
      });
    },
    onError: () => {
      toast({ 
        title: 'Failed to cancel subscription', 
        description: 'Please try again or contact support.',
        variant: 'destructive' 
      });
    },
  });

  // Plan display logic
  const getPlanDisplayName = () => {
    if (!userData?.subscriptionTier) return 'Free';
    switch (userData.subscriptionTier) {
      case 'basic': return 'Basic';
      case 'premium': return 'Premium';
      case 'enterprise': return 'Enterprise';
      default: return 'Free';
    }
  };

  const getPlanBadgeColor = () => {
    if (!userData?.subscriptionTier) return 'bg-muted text-muted-foreground';
    switch (userData.subscriptionTier) {
      case 'basic': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'premium': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'enterprise': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isSubscribed = userData?.subscriptionTier && userData?.subscriptionStatus === 'active';

  const userName = userData?.firstName 
    ? `${userData.firstName}${userData.lastName ? ' ' + userData.lastName : ''}`
    : userData?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 border-b flex items-center px-4 sticky top-0 bg-background z-10 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/')}
          data-testid="button-back"
          className="hover-elevate"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Account</h2>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {userData?.profileImageUrl && <AvatarImage src={userData.profileImageUrl} />}
                <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">
                  {userData?.firstName?.charAt(0) || userData?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium" data-testid="text-user-name">{userName}</p>
                <p className="text-sm text-muted-foreground" data-testid="text-user-email">{userData?.email}</p>
              </div>
            </div>
          </Card>

          {/* Plan Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Plan</h2>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold" data-testid="text-plan-name">{getPlanDisplayName()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPlanBadgeColor()}`}>
                      {isSubscribed ? 'Active' : getPlanDisplayName() === 'Free' ? '' : 'Inactive'}
                    </span>
                  </div>
                  {isSubscribed && (
                    <p className="text-sm text-muted-foreground">
                      Subscription tokens: {userData?.tokens ?? 0}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/pricing')}
                className="hover-elevate"
                data-testid="button-view-plans"
              >
                View Plans
              </Button>
            </div>
            
            {/* Cancel Subscription - Only shown for active subscribers */}
            {isSubscribed && (
              <div className="pt-4 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-destructive border-destructive/50 hover:bg-destructive/10 hover-elevate"
                      data-testid="button-cancel-subscription"
                    >
                      Cancel Subscription
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Cancel Subscription
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>Are you sure you want to cancel your subscription?</p>
                        <div className="p-3 bg-muted rounded-lg text-sm">
                          <p className="font-medium text-foreground mb-2">What happens when you cancel:</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Your subscription will remain active until the end of your billing period</li>
                            <li>Your <strong>subscription tokens will be removed</strong> at the end of the period</li>
                            <li>Any <strong>one-time purchased tokens will be kept</strong> and remain usable</li>
                          </ul>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => cancelSubscriptionMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={cancelSubscriptionMutation.isPending}
                      >
                        {cancelSubscriptionMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tokens</h2>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold" data-testid="text-tokens">
                  {(userData?.tokens ?? 0) + (userData?.purchasedTokens ?? 0)}
                </span>
                <span className="text-muted-foreground">tokens remaining</span>
              </div>
            </div>
            <Button
              onClick={handleBuyCredits}
              className="w-full hover-elevate active-elevate-2"
              data-testid="button-buy-tokens"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Buy More Tokens
            </Button>
          </Card>

          {/* PWA Install Card - Android/Desktop */}
          {isInstallable && !isInstalled && (
            <Card className="p-6 bg-gradient-to-br from-green-500/5 to-blue-500/5 border-green-500/20">
              <h2 className="text-xl font-semibold mb-4">Install App</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Install Gift Xzalted on your device for quick access, offline support, and a native app experience.
              </p>
              <Button
                onClick={handleInstallPWA}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 text-white border-0 hover-elevate active-elevate-2"
                data-testid="button-install-pwa"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Add to Home Screen
              </Button>
            </Card>
          )}

          {/* iOS Install Instructions */}
          {isIOS && !isInstalled && !isInstallable && (
            <Card className="p-6 bg-gradient-to-br from-green-500/5 to-blue-500/5 border-green-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold">Install App on iPhone</h2>
              </div>
              
              <div className="space-y-8 mb-8">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">1)</div>
                  <p className="font-semibold text-foreground text-lg">Tap the Share button</p>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Look for <Share className="inline h-4 w-4 mx-1" /> in Safari (bottom of screen or top right)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">2)</div>
                  <p className="font-semibold text-foreground text-lg">Find "Add to Home Screen"</p>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Scroll down in the share menu to find this option
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">3)</div>
                  <p className="font-semibold text-foreground text-lg">Tap "Add" to confirm</p>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Check your Home Screen to find the app icon
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-base">💡</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This must be done in Safari browser. The Share button cannot be triggered automatically on iOS.
                </p>
              </div>
            </Card>
          )}

          {/* Already Installed Message */}
          {isInstalled && (
            <Card className="p-6 bg-gradient-to-br from-green-500/5 to-blue-500/5 border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">App Installed</h3>
                  <p className="text-sm text-muted-foreground">
                    Gift Xzalted is installed on your device
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6 border-destructive/50">
            <h2 className="text-xl font-semibold mb-4 text-destructive">Account Actions</h2>
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full hover-elevate active-elevate-2"
              data-testid="button-signout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}
