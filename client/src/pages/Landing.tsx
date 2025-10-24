import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';
import type { Profile } from '@shared/schema';
import { Gift, FileText, DollarSign, Sparkles, Settings, MoreVertical, Pencil, Trash2, Plus, LogIn, Coins, Users, ListPlus, Moon, Sun, Mail, Download, Smartphone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsModal } from '@/components/SettingsModal';
import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function Landing() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [profileSelectDialogOpen, setProfileSelectDialogOpen] = useState(false);
  const [loginPromptDialogOpen, setLoginPromptDialogOpen] = useState(false);
  const [newGiftListName, setNewGiftListName] = useState('');
  const { toast} = useToast();
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  const { data: profiles, isLoading: profilesLoading } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
    enabled: isAuthenticated,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Profile> }) => {
      return apiRequest('PATCH', `/api/profiles/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({ title: 'Profile updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/profiles/${id}`);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['/api/profiles'] });
      toast({ title: 'Profile deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete profile', variant: 'destructive' });
    },
  });

  const clearProfileMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/profiles/${id}/clear`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({ title: 'Profile data cleared successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to clear profile', variant: 'destructive' });
    },
  });

  const createGiftListMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest('POST', '/api/profiles', { name });
      const newProfile = await response.json() as Profile;
      return newProfile;
    },
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({ title: 'Gift list created successfully' });
      setCreateDialogOpen(false);
      setNewGiftListName('');
      // Navigate to the new gift list
      setLocation(`/profile/${newProfile.id}`);
    },
    onError: () => {
      toast({ title: 'Failed to create gift list', variant: 'destructive' });
    },
  });

  const handleGiftTrackerClick = () => {
    // Wait for auth to finish loading before checking authentication
    if (authLoading) return;
    
    if (!isAuthenticated) {
      handleSignIn();
      return;
    }
    
    // Create a new profile with default name
    const defaultName = `Gift List ${(profiles?.length || 0) + 1}`;
    createGiftListMutation.mutate(defaultName);
  };

  const handleTrainAgentClick = () => {
    // Wait for auth to finish loading before checking authentication
    if (authLoading) return;
    
    if (!isAuthenticated) {
      setLoginPromptDialogOpen(true);
      return;
    }

    // If no profiles, navigate to create a profile first
    if (!profiles || profiles.length === 0) {
      toast({ 
        title: 'Create a profile first', 
        description: 'You need to create a profile before training an AI agent'
      });
      setLocation('/onboarding');
      return;
    }

    // Show profile selection dialog
    setProfileSelectDialogOpen(true);
  };

  const handleSignIn = () => {
    window.location.href = '/api/login';
  };

  const handleCreateGiftList = () => {
    if (!newGiftListName.trim()) {
      toast({ title: 'Please enter a name', variant: 'destructive' });
      return;
    }
    createGiftListMutation.mutate(newGiftListName.trim());
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex flex-col">
        <AppHeader />

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full text-center space-y-10">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground">Never miss a gift</h1>
              <p className="text-lg text-muted-foreground">
                Remember people, dates, and ideas the old school way—then generate recommendations right when you need them.
              </p>
            </div>

            {/* Sign In Button - Mobile First */}
            <div className="md:hidden">
              <Button
                onClick={handleSignIn}
                size="lg"
                className="w-full max-w-md h-12 text-base hover-elevate active-elevate-2"
                data-testid="button-signin-mobile"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In to Get Started - It's Free
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-left">
              <Card className="p-6 space-y-3 hover-elevate">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Free Gift Tracker</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create up to 5 profiles with unlimited gift lists to keep track of ideas for everyone you care about. Need more? Check out our plans.
                </p>
              </Card>

              <Card className="p-6 space-y-3 hover-elevate">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <ListPlus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-foreground">Never Forget</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Remember birthdays, anniversaries, and special occasions. Store gift ideas as you find them throughout the year.
                </p>
              </Card>

              <Card className="p-6 space-y-3 hover-elevate">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-primary/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="font-semibold text-foreground">AI-Powered Ideas</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upgrade to get personalized AI recommendations based on detailed profiles and preferences.
                </p>
              </Card>

              <Card className="p-6 space-y-3 hover-elevate">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Organized by Person</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep separate profiles for each person with their own gift lists for different occasions.
                </p>
              </Card>

              {/* PWA Install Card - Only show if installable */}
              {isInstallable && !isInstalled && (
                <Card 
                  className="p-6 space-y-3 hover-elevate active-elevate-2 cursor-pointer"
                  onClick={async () => {
                    const installed = await promptInstall();
                    if (installed) {
                      toast({ title: 'App installed successfully!' });
                    }
                  }}
                  data-testid="card-install-pwa"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-foreground">Install App</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add Gift Xzalted to your home screen for quick access and offline support.
                  </p>
                </Card>
              )}
            </div>

            {/* Theme Toggle Card */}
            <div className="flex justify-center">
              <Card 
                className="p-4 hover-elevate active-elevate-2 cursor-pointer max-w-xs"
                onClick={toggleTheme}
                data-testid="card-theme-toggle"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    {theme === 'light' ? (
                      <Moon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <Sun className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                  </p>
                </div>
              </Card>
            </div>

            {/* Sign In Button - Desktop */}
            <div className="hidden md:block">
              <Button
                onClick={handleSignIn}
                size="lg"
                className="w-full max-w-md h-12 text-base hover-elevate active-elevate-2"
                data-testid="button-signin"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In to Get Started - It's Free
              </Button>
            </div>
          </div>
        </main>

        <footer className="border-t">
          <div className="flex items-center justify-center gap-8 px-6 py-3">
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
          </div>
          <div className="flex items-center justify-center gap-4 px-6 py-2 text-xs text-muted-foreground border-t">
            <button
              onClick={() => setLocation('/privacy')}
              className="hover:text-foreground transition-colors hover:underline"
              data-testid="link-privacy"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => setLocation('/terms')}
              className="hover:text-foreground transition-colors hover:underline"
              data-testid="link-terms"
            >
              Terms & Conditions
            </button>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        profile={selectedProfile}
        onSave={(updates) => {
          if (selectedProfile) {
            updateProfileMutation.mutate({ id: selectedProfile.id, updates });
          }
        }}
        onDelete={(id) => deleteProfileMutation.mutate(id)}
        onClear={(id) => clearProfileMutation.mutate(id)}
      />
      
      <AppHeader />

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Profile Counter and Create Button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground" data-testid="profile-counter">
              {profiles?.length || 0}/5 profiles
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="default"
              className="hover-elevate active-elevate-2"
              data-testid="button-create-profile"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Profile
            </Button>
          </div>

          {/* Profile Cards Grid */}
          {profilesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-card animate-pulse rounded-lg" />
              ))}
            </div>
          ) : profiles && profiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {profiles.map(profile => (
                <div
                  key={profile.id}
                  className="group"
                >
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start gap-3">
                      {/* Color Swatch */}
                      <button
                        onClick={() => setLocation(`/profile/${profile.id}`)}
                        className="w-12 h-12 rounded-md flex-shrink-0 hover-elevate active-elevate-2"
                        style={{ backgroundColor: profile.color || '#3B82F6' }}
                        data-testid={`profile-card-${profile.id}`}
                      />
                      <button
                        onClick={() => setLocation(`/profile/${profile.id}`)}
                        className="flex-1 min-w-0 text-left hover-elevate active-elevate-2 p-2 rounded-md -m-2"
                      >
                        <h3 className="font-medium text-foreground truncate">{profile.name}</h3>
                      </button>
                      
                      {/* Settings Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover-elevate flex-shrink-0"
                            data-testid={`profile-menu-${profile.id}`}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Profile menu for ${profile.name}`}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedProfile(profile);
                            setSettingsOpen(true);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedProfile(profile);
                            setSettingsOpen(true);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Change Color
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(`Delete profile "${profile.name}"?`)) {
                                deleteProfileMutation.mutate(profile.id);
                              }
                            }}
                            data-testid={`button-delete-${profile.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <p className="text-muted-foreground text-lg">No profiles yet</p>
              <p className="text-sm text-muted-foreground">Click "Create New Profile" above to get started</p>
            </div>
          )}

          {/* Need More Profiles - Below Profiles */}
          {profiles && profiles.length > 0 && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Need more profiles?{' '}
                <button
                  onClick={() => setLocation('/pricing')}
                  className="text-primary hover:underline"
                  data-testid="link-upgrade-profiles"
                >
                  Check out the profile plans
                </button>
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t">
        <div className="flex items-center justify-center gap-8 px-6 py-3">
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
        </div>
        <div className="flex items-center justify-center gap-4 px-6 py-2 text-xs text-muted-foreground border-t">
          <button
            onClick={() => setLocation('/privacy')}
            className="hover:text-foreground transition-colors hover:underline"
            data-testid="link-privacy"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            onClick={() => setLocation('/terms')}
            className="hover:text-foreground transition-colors hover:underline"
            data-testid="link-terms"
          >
            Terms & Conditions
          </button>
        </div>
      </footer>

      {/* Create Profile Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-profile">
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
            <DialogDescription>
              Enter a name for the person you're shopping for (e.g., "Mom", "Dad", "Sarah")
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Person's Name</Label>
              <Input
                id="profile-name"
                placeholder="e.g., Mom"
                value={newGiftListName}
                onChange={(e) => setNewGiftListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !createGiftListMutation.isPending) {
                    handleCreateGiftList();
                  }
                }}
                maxLength={20}
                data-testid="input-gift-list-name"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-right">
                {newGiftListName.length}/20 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewGiftListName('');
              }}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGiftList}
              disabled={createGiftListMutation.isPending || !newGiftListName.trim()}
              data-testid="button-confirm-create"
            >
              {createGiftListMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Prompt Dialog */}
      <Dialog open={loginPromptDialogOpen} onOpenChange={setLoginPromptDialogOpen}>
        <DialogContent data-testid="dialog-login-prompt">
          <DialogHeader>
            <DialogTitle>Sign in to train your AI agent</DialogTitle>
            <DialogDescription>
              You need to be signed in to train an AI agent and get personalized gift recommendations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLoginPromptDialogOpen(false)}
              data-testid="button-cancel-login"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSignIn}
              data-testid="button-signin-prompt"
            >
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Selection Dialog */}
      <Dialog open={profileSelectDialogOpen} onOpenChange={setProfileSelectDialogOpen}>
        <DialogContent data-testid="dialog-profile-select">
          <DialogHeader>
            <DialogTitle>Select a profile to train</DialogTitle>
            <DialogDescription>
              Choose which profile you'd like to train your AI agent with
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
            {profiles?.map(profile => (
              <button
                key={profile.id}
                onClick={() => {
                  setProfileSelectDialogOpen(false);
                  setLocation(`/questionnaire?profile=${profile.id}`);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover-elevate active-elevate-2 text-left"
                data-testid={`button-select-profile-${profile.id}`}
              >
                <div
                  className="w-10 h-10 rounded-md flex-shrink-0"
                  style={{ backgroundColor: profile.color || '#3B82F6' }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{profile.name}</h3>
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProfileSelectDialogOpen(false)}
              data-testid="button-cancel-profile-select"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
