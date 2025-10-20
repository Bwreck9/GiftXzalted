import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { insertProfileSchema, type InsertProfile, type Profile, type User } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { usePersistedDraft } from '@/hooks/usePersistedDraft';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Gift, Sparkles, Coins, Lock } from 'lucide-react';
import { z } from 'zod';

const formSchema = insertProfileSchema.extend({
  userId: z.string().optional(),
  color: z.string().default('blue'),
});

const PROFILE_LIMITS = {
  free: 5,
  basic: 10,
  premium: 20,
  enterprise: Infinity
};

const TOKENS_PER_GENERATION = 500;

// Helper function to get profile limit for a user
function getProfileLimit(subscriptionTier: string | null): number {
  if (!subscriptionTier) return PROFILE_LIMITS.free;
  const tier = subscriptionTier.toLowerCase();
  return PROFILE_LIMITS[tier as keyof typeof PROFILE_LIMITS] || PROFILE_LIMITS.free;
}

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  name: '',
  shoppingFor: 'another' as const,
  age: 25,
  event: 'Birthday' as const,
  gender: '',
  relationship: '',
  personality: '',
  interests: '',
  color: 'blue',
};

export default function Questionnaire() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [pendingGenerate, setPendingGenerate] = useState(false);
  
  // Get profile ID from URL parameter if training an existing profile
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('profile');

  // Draft persistence for unauthenticated users
  const { draft, setDraft, clearDraft } = usePersistedDraft<FormValues>(
    'gift-spark-questionnaire-draft',
    defaultValues
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: draft,
  });

  // Watch form values and persist to draft
  useEffect(() => {
    const subscription = form.watch((values) => {
      setDraft(values as FormValues);
    });
    return () => subscription.unsubscribe();
  }, [form, setDraft]);

  // Populate form with existing profile data when it loads
  useEffect(() => {
    if (existingProfile) {
      form.reset({
        name: existingProfile.name || '',
        shoppingFor: existingProfile.shoppingFor || 'another',
        age: existingProfile.age || 25,
        event: existingProfile.event || 'Birthday',
        gender: existingProfile.gender || '',
        relationship: existingProfile.relationship || '',
        personality: existingProfile.personality || '',
        interests: existingProfile.interests || '',
        color: existingProfile.color || 'blue',
      });
    }
  }, [existingProfile, form]);

  const { data: profiles } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
    enabled: !!user,
  });

  const { data: userData } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    enabled: !!user,
  });

  // Load existing profile if profileId is provided
  const { data: existingProfile } = useQuery<Profile>({
    queryKey: ['/api/profiles', profileId],
    queryFn: async () => {
      const response = await fetch(`/api/profiles/${profileId}`);
      if (!response.ok) throw new Error('Failed to load profile');
      return response.json();
    },
    enabled: !!profileId && !!user,
  });

  const createMutation = useMutation({
    mutationFn: async ({ data, generateResponse }: { data: InsertProfile; generateResponse: boolean }) => {
      return apiRequest('POST', '/api/profiles', { ...data, generateResponse });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      clearDraft(); // Clear draft after successful creation
      toast({ 
        title: isGenerating ? 'Profile created with AI response!' : 'Profile created!', 
        description: isGenerating ? 'Your AI-powered gift recommendations are ready.' : 'Your profile has been saved.' 
      });
      setLocation(`/profile/${data.id}`);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create profile', 
        variant: 'destructive' 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, generateResponse }: { id: string; data: Partial<InsertProfile>; generateResponse: boolean }) => {
      return apiRequest('PATCH', `/api/profiles/${id}`, { ...data, generateResponse });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profileId] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ 
        title: isGenerating ? 'Profile updated with AI response!' : 'Profile updated!', 
        description: isGenerating ? 'Your AI-powered gift recommendations are ready.' : 'Your profile has been saved.' 
      });
      setLocation(`/profile/${data.id}`);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update profile', 
        variant: 'destructive' 
      });
    },
  });

  const handleGoogleSignIn = () => {
    // Redirect to Replit Auth login
    window.location.href = '/api/login';
  };

  // Check if user is authenticated after login redirect
  useEffect(() => {
    if (user && pendingGenerate) {
      // After auth, retry submission with pending generation state
      handleSubmit(pendingGenerate)();
      setPendingGenerate(false);
    }
  }, [user, pendingGenerate]);

  const handleSubmit = (generateResponse: boolean) => {
    return form.handleSubmit((data: FormValues) => {
      // Check if user is authenticated
      if (!user) {
        setPendingGenerate(generateResponse);
        setShowAuthModal(true);
        return;
      }

      // Check token balance for premium generation
      if (generateResponse && (!userData || userData.tokens < TOKENS_PER_GENERATION)) {
        setShowTokenModal(true);
        return;
      }

      setIsGenerating(generateResponse);

      // If updating an existing profile
      if (profileId && existingProfile) {
        const profileData: Partial<InsertProfile> = {
          ...data,
        };
        updateMutation.mutate({ id: profileId, data: profileData, generateResponse });
      } else {
        // Creating a new profile
        const profileData: InsertProfile = {
          ...data,
          userId: (user as any).id,
        };
        
        // Check profile limit based on subscription tier
        const profileCount = profiles?.length || 0;
        const profileLimit = getProfileLimit(userData?.subscriptionTier || null);
        if (profileCount >= profileLimit) {
          const tierName = userData?.subscriptionTier || 'free';
          toast({ 
            title: 'Profile limit reached', 
            description: `You've reached the maximum of ${profileLimit} ${tierName} profiles. Upgrade to create more.`, 
            variant: 'destructive' 
          });
          return;
        }

        createMutation.mutate({ data: profileData, generateResponse });
      }
    });
  };

  const shoppingFor = form.watch('shoppingFor');
  const age = form.watch('age');

  const profileCount = profiles?.length || 0;
  const hasEnoughTokens = userData && userData.tokens >= TOKENS_PER_GENERATION;
  const profileLimit = getProfileLimit(userData?.subscriptionTier || null);
  const canCreateProfile = profileCount < profileLimit;

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
        <div className="flex-1 flex items-center justify-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">{profileId ? 'Train Agent' : 'New Profile'}</h1>
        </div>
        {user && userData && (
          <Badge variant="secondary" className="gap-1" data-testid="badge-tokens">
            <Coins className="h-3 w-3" />
            {userData.tokens}
          </Badge>
        )}
        {!user && <div className="w-10" />}
      </header>

      {user && (
        <div className="border-b bg-muted/50 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Profiles: {profileCount} / {profileLimit === Infinity ? '∞' : profileLimit} ({userData?.subscriptionTier || 'free'})
            </span>
            {profileCount >= profileLimit && (
              <span className="text-destructive font-medium">Limit reached</span>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto p-4 pb-32">
        <div className="max-w-lg mx-auto">
          <Form {...form}>
            <form className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Sarah, Mom, Best Friend"
                        {...field}
                        data-testid="input-name"
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shoppingFor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shopping for</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <Card className="flex-1 hover-elevate">
                          <label className="flex items-center gap-3 p-4 cursor-pointer">
                            <RadioGroupItem value="self" data-testid="radio-shopping-self" />
                            <span className="font-medium">Yourself</span>
                          </label>
                        </Card>
                        <Card className="flex-1 hover-elevate">
                          <label className="flex items-center gap-3 p-4 cursor-pointer">
                            <RadioGroupItem value="another" data-testid="radio-shopping-another" />
                            <span className="font-medium">Someone Else</span>
                          </label>
                        </Card>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age: {age}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={120}
                        step={1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        data-testid="slider-age"
                        className="py-4"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="event"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-event" className="h-12">
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Birthday">Birthday</SelectItem>
                        <SelectItem value="Anniversary">Anniversary</SelectItem>
                        <SelectItem value="Christmas">Christmas</SelectItem>
                        <SelectItem value="Valentine's Day">Valentine's Day</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Male, Female, Non-binary"
                        {...field}
                        data-testid="input-gender"
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {shoppingFor === 'another' && (
                <FormField
                  control={form.control}
                  name="relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Mother, Best Friend, Colleague"
                          {...field}
                          value={field.value || ''}
                          data-testid="input-relationship"
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="personality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personality</FormLabel>
                    <FormDescription className="text-xs">
                      The more detail you provide, the better the AI recommendations
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Describe their personality, traits, what they're like..."
                        {...field}
                        data-testid="textarea-personality"
                        className="min-h-[120px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interests & Hobbies</FormLabel>
                    <FormDescription className="text-xs">
                      What do they enjoy? What are they passionate about?
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Sports, reading, cooking, gaming, travel, etc..."
                        {...field}
                        data-testid="textarea-interests"
                        className="min-h-[120px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="max-w-lg mx-auto space-y-3">
          <Button
            onClick={handleSubmit(false)}
            disabled={createMutation.isPending || (!!user && !canCreateProfile)}
            variant="outline"
            className="w-full h-12 text-base hover-elevate active-elevate-2"
            data-testid="button-create-profile"
          >
            {createMutation.isPending && !isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-foreground border-t-transparent rounded-full" />
                Creating...
              </div>
            ) : (
              <>
                {!user && <Lock className="w-4 h-4 mr-2" />}
                Create Profile (Free)
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSubmit(true)}
            disabled={createMutation.isPending || (!!user && (!canCreateProfile || !hasEnoughTokens))}
            className="w-full h-12 text-base hover-elevate active-elevate-2"
            data-testid="button-create-with-ai"
          >
            {createMutation.isPending && isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                Generating AI Response...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Create + Generate Response ({TOKENS_PER_GENERATION} tokens)
              </div>
            )}
          </Button>

          {user && !hasEnoughTokens && (
            <p className="text-xs text-center text-muted-foreground">
              Need more tokens?{' '}
              <button
                onClick={() => setLocation('/pricing')}
                className="text-primary underline"
              >
                View Pricing
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent data-testid="dialog-auth">
          <DialogHeader>
            <DialogTitle>Sign In to Continue</DialogTitle>
            <DialogDescription>
              Create a free account to save your profile and unlock AI-powered gift recommendations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Button
              onClick={handleGoogleSignIn}
              className="w-full"
              size="lg"
              data-testid="button-google-signin"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Token Gate Modal */}
      <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
        <DialogContent data-testid="dialog-token-gate">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Tokens Required
            </DialogTitle>
            <DialogDescription>
              You need {TOKENS_PER_GENERATION} tokens to generate AI-powered gift recommendations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-4">
              Your current balance: <strong>{userData?.tokens || 0} tokens</strong>
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTokenModal(false)}
              className="w-full sm:w-auto"
              data-testid="button-token-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowTokenModal(false);
                setLocation('/pricing?highlight=buytokens');
              }}
              className="w-full sm:w-auto"
              data-testid="button-token-buy"
            >
              <Coins className="w-4 h-4 mr-2" />
              Buy Tokens
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
