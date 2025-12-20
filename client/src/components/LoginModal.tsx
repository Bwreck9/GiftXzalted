import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Loader2, Mail, Bug } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';

// Check if we're in development mode
const isDev = import.meta.env.DEV;

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const { toast } = useToast();

  const handleDevLogin = async () => {
    if (!isDev) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/dev-login', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.devToken) {
        // Store the dev token for API calls
        localStorage.setItem('devToken', data.devToken);
        // Invalidate user query to trigger refetch with new token
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        toast({
          title: 'Dev Login Successful',
          description: `Logged in as ${data.user?.firstName} ${data.user?.lastName} with ${data.user?.purchasedTokens || 0} tokens`,
        });
        onOpenChange(false);
        // Force a page reload to pick up the new auth state
        window.location.reload();
      } else {
        throw new Error(data.message || 'Dev login failed');
      }
    } catch (error: any) {
      console.error('Dev login error:', error);
      toast({
        title: 'Dev login failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      // If user is null, redirect flow is being used - don't close modal yet
      if (user) {
        onOpenChange(false);
      }
      // If null, redirect is happening, page will reload
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast({
        title: 'Sign in failed',
        description: error.message || 'Unable to sign in with Google',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      toast({
        title: 'Missing fields',
        description: 'Please enter your email and password',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      onOpenChange(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      let message = 'Unable to sign in';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or password';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      }
      toast({
        title: 'Sign in failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password) {
      toast({
        title: 'Missing fields',
        description: 'Please enter your email and password',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Weak password',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await signUpWithEmail(email, password);
      onOpenChange(false);
      setEmail('');
      setPassword('');
      toast({
        title: 'Account created!',
        description: 'Welcome to Gift Xzalted',
      });
    } catch (error: any) {
      console.error('Email sign-up error:', error);
      let message = 'Unable to create account';
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak';
      }
      toast({
        title: 'Sign up failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-login">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Welcome to Gift Xzalted</DialogTitle>
          <DialogDescription className="text-center">
            Sign in to start tracking gift ideas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 text-base hover-elevate active-elevate-2"
            data-testid="button-google-signin"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <SiGoogle className="h-5 w-5 mr-3" />
                Continue with Google
              </>
            )}
          </Button>

          {isDev && (
            <Button
              onClick={handleDevLogin}
              disabled={isLoading}
              variant="outline"
              className="w-full h-10 text-sm border-dashed border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950"
              data-testid="button-dev-login"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Bug className="h-4 w-4 mr-2" />
                  Dev Login (Test Account)
                </>
              )}
            </Button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" data-testid="tab-signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  data-testid="input-signin-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleEmailSignIn();
                    }
                  }}
                  disabled={isLoading}
                  data-testid="input-signin-password"
                />
              </div>
              <Button
                onClick={handleEmailSignIn}
                disabled={isLoading}
                className="w-full h-11 hover-elevate active-elevate-2"
                data-testid="button-email-signin"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  data-testid="input-signup-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleEmailSignUp();
                    }
                  }}
                  disabled={isLoading}
                  data-testid="input-signup-password"
                />
              </div>
              <Button
                onClick={handleEmailSignUp}
                disabled={isLoading}
                className="w-full h-11 hover-elevate active-elevate-2"
                data-testid="button-email-signup"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
