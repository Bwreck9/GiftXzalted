import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ProfileCard } from '@/components/ProfileCard';
import { NewProfileCard } from '@/components/NewProfileCard';
import type { Profile } from '@shared/schema';
import { Gift, Settings, DollarSign, FileText } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';

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
        <header className="h-16 border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Gift Finder</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground">Find the Perfect Gift</h1>
              <p className="text-lg text-muted-foreground">
                AI-powered recommendations based on personality, interests, and occasion
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
      <header className="h-16 border-b flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Gift Finder</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Profiles</h1>
            <p className="text-muted-foreground">
              Select a profile to get gift recommendations
            </p>
          </div>

          {profilesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-card animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <NewProfileCard onClick={() => setLocation('/profile/new')} />
              {profiles?.map(profile => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onClick={() => setLocation(`/chat/${profile.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="h-16 border-t flex items-center justify-center gap-8 px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/settings')}
          data-testid="link-settings"
          className="hover-elevate"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
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
