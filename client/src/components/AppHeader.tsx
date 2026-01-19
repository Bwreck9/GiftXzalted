import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Gift, User, Settings, Coins, Moon, Sun, LogOut, LogIn, Mail, FileText, DollarSign, Shield, ScrollText, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTheme } from '@/contexts/ThemeContext';
import { LoginModal } from '@/components/LoginModal';
import { queryClient } from '@/lib/queryClient';

export function AppHeader() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    setLocation('/');
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10 shadow-sm">
      <div className="h-14 px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Logo */}
        <button 
          onClick={() => setLocation('/')}
          className="flex items-center gap-1 sm:gap-1.5 hover-elevate active-elevate-2 p-1.5 sm:p-2 rounded-md shrink-0 min-w-0"
          data-testid="button-logo-home"
        >
          <div className="bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-1 sm:p-1.5 rounded-lg shrink-0">
            <Gift className="h-4 w-4 text-white" />
          </div>
          <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent whitespace-nowrap">
            Gift Xzalted
          </span>
        </button>

        {/* Right Side */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
          {/* Nav Links */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/about')}
            className="hover-elevate hidden sm:flex"
            data-testid="nav-about"
          >
            <FileText className="h-4 w-4 mr-1" />
            About
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/pricing')}
            className="hover-elevate hidden sm:flex"
            data-testid="nav-pricing"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Pricing
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover-elevate"
            data-testid="nav-theme-toggle"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          {/* Token Counter with Popover */}
          {user && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover-elevate active-elevate-2 shrink-0"
                  data-testid="button-token-counter"
                >
                  <Coins className="h-4 w-4 mr-1" />
                  {(user.tokens ?? 0) + (user.purchasedTokens ?? 0)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-1.5 rounded-lg">
                      <Coins className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Your Tokens</h4>
                      <p className="text-2xl font-bold text-foreground">
                        {(user.tokens ?? 0) + (user.purchasedTokens ?? 0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                      <span>Use tokens to generate AI-powered gift recommendations personalized to each profile.</span>
                    </div>
                    <p className="text-xs mt-2">200 tokens = 10 gift ideas</p>
                  </div>

                  {/* Membership Status */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Crown className="h-4 w-4 text-primary" />
                      <span className="font-medium">Plan:</span>
                      <span className="text-muted-foreground">
                        {user.subscriptionTier || 'Free'}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setLocation('/pricing')}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white border-0"
                    data-testid="button-buy-tokens"
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    Buy More Tokens
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full hover-elevate"
                data-testid="button-profile-menu"
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Mobile nav links */}
              <DropdownMenuItem 
                onClick={() => setLocation('/about')}
                className="sm:hidden"
                data-testid="menu-item-about"
              >
                <FileText className="h-4 w-4 mr-2" />
                About
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLocation('/pricing')}
                className="sm:hidden"
                data-testid="menu-item-pricing"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing
              </DropdownMenuItem>
              <DropdownMenuSeparator className="sm:hidden" />
              {isAuthenticated && (
                <>
                  <DropdownMenuItem 
                    onClick={() => setLocation('/settings')}
                    data-testid="menu-item-settings"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLocation('/support')}
                    data-testid="menu-item-support"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setLocation('/privacy')}
                    data-testid="menu-item-privacy"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Privacy Policy
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLocation('/terms')}
                    data-testid="menu-item-terms"
                  >
                    <ScrollText className="h-4 w-4 mr-2" />
                    Terms & Conditions
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {isAuthenticated ? (
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  data-testid="menu-item-sign-out"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={() => setLoginModalOpen(true)}
                  data-testid="menu-item-sign-in"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </header>
  );
}
