import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User } from '@shared/schema';
import { ArrowLeft, Coins, LogOut, CreditCard, Smartphone, Share } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  
  const { data: userData } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  const handleSignOut = () => {
    window.location.href = '/api/logout';
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
              <h2 className="text-xl font-semibold mb-4">Install App (iOS)</h2>
              <div className="space-y-3 text-sm text-muted-foreground mb-4">
                <p>To install Gift Xzalted on your iPhone or iPad:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Tap the Share button <Share className="inline h-4 w-4 mx-1" /> in Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Once installed, you'll find the app on your home screen
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
