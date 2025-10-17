import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { WelcomeDialog } from '@/components/WelcomeDialog';
import type { Profile } from '@shared/schema';
import { Gift, FileText, DollarSign, Sparkles, Settings, MoreVertical, Pencil, Trash2, Plus, LogIn, Coins } from 'lucide-react';
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

export default function Landing() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showSplash, setShowSplash] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGiftListName, setNewGiftListName] = useState('');
  const { toast} = useToast();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
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
      handleSignIn();
      return;
    }

    // Check if user has tokens
    if (!user?.tokens || user.tokens <= 0) {
      toast({ 
        title: 'No tokens available', 
        description: 'Purchase tokens to train your AI agent',
        variant: 'destructive' 
      });
      setLocation('/pricing');
      return;
    }

    // Create profile and navigate to questionnaire
    const defaultName = `AI Profile ${(profiles?.length || 0) + 1}`;
    createGiftListMutation.mutate(defaultName);
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
        <WelcomeDialog 
          externalOpen={showSplash} 
          onExternalClose={() => setShowSplash(false)}
          onGiftTrackerClick={handleGiftTrackerClick}
          onTrainAgentClick={handleTrainAgentClick}
        />
        
        <header className="h-16 border-b flex items-center justify-between px-6">
          <button 
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 hover-elevate active-elevate-2 p-2 rounded-md"
            data-testid="button-logo-home"
          >
            <Gift className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Gift Spark</span>
          </button>
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
              data-testid="button-signin"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Sign In
            </Button>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSplash(true)}
              data-testid="button-splash"
              className="hover-elevate"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Splash
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
      <WelcomeDialog 
        externalOpen={showSplash} 
        onExternalClose={() => setShowSplash(false)}
        onGiftTrackerClick={handleGiftTrackerClick}
        onTrainAgentClick={handleTrainAgentClick}
      />
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
      
      <header className="h-16 border-b flex items-center justify-between px-6">
        <button 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 hover-elevate active-elevate-2 p-2 rounded-md"
          data-testid="button-logo-home"
        >
          <Gift className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Gift Spark</span>
        </button>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setCreateDialogOpen(true)}
            size="default"
            className="hover-elevate active-elevate-2"
            data-testid="button-create-profile"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Profile
          </Button>
          <Button
            onClick={() => setLocation('/pricing')}
            variant="outline"
            size="default"
            className="hover-elevate active-elevate-2"
            data-testid="button-token-counter"
          >
            <Coins className="h-4 w-4 mr-2" />
            {user?.tokens ?? 0} tokens
          </Button>
          <Button
            onClick={() => setSettingsOpen(true)}
            variant="ghost"
            size="icon"
            className="hover-elevate active-elevate-2"
            data-testid="settings-open"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
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
                  className="relative group"
                >
                  <button
                    onClick={() => setLocation(`/profile/${profile.id}`)}
                    className="w-full p-4 rounded-lg border bg-card hover-elevate active-elevate-2 text-left"
                    data-testid={`profile-card-${profile.id}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Color Swatch */}
                      <div 
                        className="w-12 h-12 rounded-md flex-shrink-0"
                        style={{ backgroundColor: profile.color || '#3B82F6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{profile.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {profile.relationship || `Age ${profile.age}`}
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Kebab Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 hover-elevate"
                        data-testid={`profile-menu-${profile.id}`}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Profile menu for ${profile.name}`}
                      >
                        <MoreVertical className="h-4 w-4" />
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
              ))}
            </div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <p className="text-muted-foreground text-lg">No profiles yet</p>
              <p className="text-sm text-muted-foreground">Click "Create New Profile" above to get started</p>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSplash(true)}
            data-testid="button-splash"
            className="hover-elevate"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Splash
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
                data-testid="input-gift-list-name"
                autoFocus
              />
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
    </div>
  );
}
