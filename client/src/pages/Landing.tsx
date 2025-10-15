import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { WelcomeDialog } from '@/components/WelcomeDialog';
import type { Profile } from '@shared/schema';
import { Gift, UserPlus, FileText, DollarSign } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { Separator } from '@/components/ui/separator';

export default function Landing() {
  const { user, loading: authLoading, signIn } = useAuth();
  const [, setLocation] = useLocation();

  const { data: profiles, isLoading: profilesLoading } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
    enabled: !!user,
  });

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col">
        <WelcomeDialog />
        
        <header className="h-16 border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Xzalted</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground">Find the Perfect Gift</h1>
              <p className="text-lg text-muted-foreground">
                Create profiles and get thoughtful gift suggestions that actually fit the person you're shopping for
              </p>
            </div>

            <Button
              onClick={handleSignIn}
              size="lg"
              className="w-full h-12 text-base hover-elevate active-elevate-2"
              data-testid="button-signin-google"
            >
              <SiGoogle className="mr-2 h-5 w-5" />
              Sign in with Google
            </Button>
          </div>
        </main>

        <footer className="h-16 border-t flex items-center justify-center gap-8 px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/about')}
            data-testid="link-about"
            className="hover-elevate"
          >
            <FileText className="h-4 w-4 mr-2" />
            About
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/pricing')}
            data-testid="link-pricing"
            className="hover-elevate"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Pricing
          </Button>
        </footer>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <WelcomeDialog />
      
      <header className="h-16 border-b flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Xzalted</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          
          {/* New Profile Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => setLocation('/profile/new')}
              size="lg"
              className="w-full max-w-sm h-12 hover-elevate active-elevate-2"
              data-testid="button-new-profile"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              New Profile
            </Button>
          </div>

          {/* Separator */}
          <div className="flex items-center gap-4 py-4">
            <Separator className="flex-1" />
          </div>

          {/* Profiles Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Profiles
            </h2>

            {profilesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-card animate-pulse rounded-lg" />
                ))}
              </div>
            ) : profiles && profiles.length > 0 ? (
              <div className="space-y-3">
                {profiles.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => setLocation(`/profile/${profile.id}`)}
                    className="w-full text-left p-4 rounded-lg border bg-card hover-elevate active-elevate-2"
                    data-testid={`button-profile-${profile.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">{profile.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {profile.age && `Age ${profile.age}`}
                          {profile.age && profile.relationship && ' • '}
                          {profile.relationship}
                        </p>
                      </div>
                      <div className="text-muted-foreground">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                &lt;No profiles&gt;
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="h-16 border-t flex items-center justify-center gap-8 px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/gift-lists')}
          data-testid="link-gift-lists"
          className="hover-elevate"
        >
          <Gift className="h-4 w-4 mr-2" />
          Gift Lists
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/pricing')}
          data-testid="link-pricing"
          className="hover-elevate"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Pricing
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/about')}
          data-testid="link-about"
          className="hover-elevate"
        >
          <FileText className="h-4 w-4 mr-2" />
          About
        </Button>
      </footer>
    </div>
  );
}
