import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Gift, User, Settings, Coins, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';

export function AppHeader() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10 shadow-sm">
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 hover-elevate active-elevate-2 p-2 rounded-md"
          data-testid="button-logo-home"
        >
          <div className="bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-2 rounded-lg">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gift Xzalted
          </span>
        </button>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Token Counter */}
          {user && (
            <Button
              onClick={() => setLocation('/pricing')}
              variant="outline"
              size="default"
              className="hover-elevate active-elevate-2"
              data-testid="button-token-counter"
            >
              <Coins className="h-4 w-4 mr-2" />
              {user.tokens ?? 0} tokens
            </Button>
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
              <DropdownMenuItem 
                onClick={toggleTheme}
                data-testid="menu-item-theme-toggle"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-4 w-4 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark Mode
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setLocation('/settings')}
                data-testid="menu-item-settings"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
