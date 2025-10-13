import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User } from '@shared/schema';
import { ArrowLeft, Coins, LogOut, CreditCard } from 'lucide-react';

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  
  const { data: userData } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  const handleBuyCredits = () => {
    setLocation('/checkout');
  };

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
                {user?.photoURL && <AvatarImage src={user.photoURL} />}
                <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium" data-testid="text-user-name">{user?.displayName || 'User'}</p>
                <p className="text-sm text-muted-foreground" data-testid="text-user-email">{user?.email}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Credits</h2>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold" data-testid="text-credits">{userData?.credits || 0}</span>
                <span className="text-muted-foreground">queries remaining</span>
              </div>
            </div>
            <Button
              onClick={handleBuyCredits}
              className="w-full hover-elevate active-elevate-2"
              data-testid="button-buy-credits"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Buy More Credits
            </Button>
          </Card>

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
