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
import { Checkbox } from '@/components/ui/checkbox';
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
  enterprise: 100
};

const TOKENS_PER_GENERATION = 200;

// Helper function to get profile limit for a user
function getProfileLimit(subscriptionTier: string | null): number {
  if (!subscriptionTier) return PROFILE_LIMITS.free;
  const tier = subscriptionTier.toLowerCase();
  return PROFILE_LIMITS[tier as keyof typeof PROFILE_LIMITS] || PROFILE_LIMITS.free;
}

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  name: '',
  color: 'blue',
  ageRange: undefined,
  gender: undefined,
  personalityTraits: [],
  interests: undefined,
  relationship: undefined,
  closeness: undefined,
  budget: undefined,
  giftPreferences: [],
  dislikes: undefined,
  giftStyle: undefined,
  location: undefined,
  additionalNotes: undefined,
};

export default function Questionnaire() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [pendingGenerate, setPendingGenerate] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('profile');
  const fromContext = urlParams.get('from'); // e.g., 'giftlist'
  const listId = urlParams.get('listId'); // gift list ID if coming from gift list

  // Draft persistence for unauthenticated users
  const { draft, setDraft, clearDraft } = usePersistedDraft<FormValues>(
    'gift-spark-questionnaire-draft',
    defaultValues
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: draft,
  });

  // Load existing profile if profileId is provided (must be before useEffect that uses it)
  const { data: existingProfile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ['/api/profiles', profileId],
    queryFn: async () => {
      const response = await fetch(`/api/profiles/${profileId}`);
      if (!response.ok) throw new Error('Failed to load profile');
      return response.json();
    },
    enabled: !!profileId && !!user,
  });

  const { data: profiles } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
    enabled: !!user,
  });

  const { data: userData } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    enabled: !!user,
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
        color: existingProfile.color || 'blue',
        ageRange: existingProfile.ageRange as any,
        gender: existingProfile.gender || undefined,
        personalityTraits: (existingProfile.personalityTraits || []) as any,
        interests: existingProfile.interests || undefined,
        relationship: existingProfile.relationship as any,
        closeness: existingProfile.closeness as any,
        budget: existingProfile.budget as any,
        giftPreferences: (existingProfile.giftPreferences || []) as any,
        dislikes: existingProfile.dislikes || undefined,
        giftStyle: existingProfile.giftStyle as any,
        location: existingProfile.location || undefined,
        additionalNotes: existingProfile.additionalNotes || undefined,
      });
    }
  }, [existingProfile, form]);

  const createMutation = useMutation({
    mutationFn: async ({ data, generateResponse }: { data: InsertProfile; generateResponse: boolean }) => {
      const response = await apiRequest('POST', '/api/profiles', { ...data, generateResponse });
      return response.json();
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
      // Handle profile limit error specially
      if (error.message?.includes('Profile limit reached')) {
        toast({ 
          title: 'Profile limit reached', 
          description: (
            <div className="flex flex-col gap-2">
              <p>{error.message}</p>
              <button
                onClick={() => setLocation('/pricing')}
                className="text-sm underline text-left hover:no-underline"
                data-testid="link-pricing-from-error"
              >
                View pricing plans →
              </button>
            </div>
          ) as any,
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Error', 
          description: error.message || 'Failed to create profile', 
          variant: 'destructive' 
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProfile> }) => {
      const response = await apiRequest('PATCH', `/api/profiles/${id}`, data);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profileId] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // If coming from gift list context, navigate back to the list
      if (fromContext === 'giftlist' && listId) {
        toast({ 
          title: 'Profile saved!', 
          description: 'Returning to your gift list.' 
        });
        // Add trigger parameter to auto-generate when returning to list
        setLocation(`/gift-list/${listId}${isGenerating ? '?trigger=generate' : ''}`);
      } else {
        toast({ 
          title: isGenerating ? 'Profile updated with AI response!' : 'Profile updated!', 
          description: isGenerating ? 'Your AI-powered gift recommendations are ready.' : 'Your profile has been saved.' 
        });
        setLocation(`/profile/${data.id}`);
      }
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
      const totalTokens = (userData?.tokens ?? 0) + (userData?.purchasedTokens ?? 0);
      if (generateResponse && (!userData || totalTokens < TOKENS_PER_GENERATION)) {
        setShowTokenModal(true);
        return;
      }

      setIsGenerating(generateResponse);

      // If updating an existing profile
      if (profileId) {
        const profileData: Partial<InsertProfile> = {
          ...data,
        };
        updateMutation.mutate({ id: profileId, data: profileData });
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
            description: (
              <div className="flex flex-col gap-2">
                <p>You've reached the maximum of {profileLimit} {tierName} profiles.</p>
                <button
                  onClick={() => setLocation('/pricing')}
                  className="text-sm underline text-left hover:no-underline"
                  data-testid="link-pricing-from-limit"
                >
                  Upgrade to create more profiles →
                </button>
              </div>
            ) as any,
            variant: 'destructive' 
          });
          return;
        }

        createMutation.mutate({ data: profileData, generateResponse });
      }
    });
  };

  const handleClearAll = () => {
    form.reset(defaultValues);
    setCustomGender('');
    setCustomPersonalityOther('');
    setAdditionalNotesCount(0);
    setShowClearDialog(false);
    toast({ title: 'All selections cleared', description: 'The questionnaire has been reset.' });
  };

  const [customGender, setCustomGender] = useState('');
  const [customPersonalityOther, setCustomPersonalityOther] = useState('');
  const [additionalNotesCount, setAdditionalNotesCount] = useState(0);
  const gender = form.watch('gender');

  const profileCount = profiles?.length || 0;
  const totalUserTokens = (userData?.tokens ?? 0) + (userData?.purchasedTokens ?? 0);
  const hasEnoughTokens = userData && totalUserTokens >= TOKENS_PER_GENERATION;
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowClearDialog(true)}
            data-testid="button-clear-all"
            className="hover-elevate text-xs"
          >
            Clear All
          </Button>
          {user && userData && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-tokens">
              <Coins className="h-3 w-3" />
              {(userData.tokens ?? 0) + (userData.purchasedTokens ?? 0)}
            </Badge>
          )}
        </div>
      </header>

      {user && !profileId && (
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
            <form className="space-y-8">
              {/* Section 1: About the Recipient */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">
                    {existingProfile?.name ? `About ${existingProfile.name}` : 'About the Recipient'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {existingProfile?.name 
                      ? `Tell us about ${existingProfile.name}` 
                      : 'Tell us about the person you\'re shopping for'}
                  </p>
                </div>

                {/* Profile Name - Display only if editing, input if creating */}
                {profileId && profileLoading ? (
                  <div>
                    <FormLabel>Profile Name</FormLabel>
                    <div className="h-9 flex items-center text-muted-foreground">Loading...</div>
                  </div>
                ) : profileId && existingProfile ? (
                  <div>
                    <FormLabel>Profile Name</FormLabel>
                    <p className="text-2xl font-bold mt-2" data-testid="text-profile-name">{existingProfile.name}</p>
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile Name</FormLabel>
                        <FormDescription className="text-xs">Who is this profile for?</FormDescription>
                        <FormControl>
                          <Input
                            placeholder="e.g., Sarah, Mom, Best Friend"
                            maxLength={20}
                            {...field}
                            data-testid="input-name"
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">{field.value?.length || 0}/20 characters</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Age Range */}
                <FormField
                  control={form.control}
                  name="ageRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Range</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-2 gap-3"
                        >
                          {['Child (0-12)', 'Teen (13-19)', 'Young Adult (20-30)', 'Adult 1 (31-50)', 'Adult 2 (51-70)', 'Senior 70+'].map((range) => (
                            <Card key={range} className="hover-elevate">
                              <label className="flex items-center gap-3 p-3 cursor-pointer">
                                <RadioGroupItem value={range} data-testid={`radio-age-${range.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} />
                                <span className="text-sm">{range}</span>
                              </label>
                            </Card>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gender */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender Identity (optional)</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          if (value !== 'Other') {
                            setCustomGender('');
                            field.onChange(value);
                          } else {
                            field.onChange('');
                          }
                        }}
                        value={field.value && field.value !== customGender ? field.value : (customGender ? 'Other' : undefined)}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-gender">
                            <SelectValue placeholder="Select gender identity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {(field.value === '' || customGender || (!field.value?.match(/^(Male|Female)$/))) && (
                        <div className="mt-2">
                          <Input
                            placeholder="Please specify (the AI will understand)"
                            maxLength={500}
                            value={customGender || field.value || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setCustomGender(value);
                              field.onChange(value);
                            }}
                            data-testid="input-custom-gender"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Our AI is inclusive and understands all gender identities</p>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Personality Traits */}
                <FormField
                  control={form.control}
                  name="personalityTraits"
                  render={() => (
                    <FormItem>
                      <FormLabel>How would you describe their personality?</FormLabel>
                      <FormDescription className="text-xs">Select all that apply — use keywords, not sentences</FormDescription>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {['Adventurous', 'Thoughtful', 'Funny/Lighthearted', 'Introverted', 'Outgoing', 'Artistic', 'Tech-savvy', 'Sentimental'].map((trait) => (
                          <FormField
                            key={trait}
                            control={form.control}
                            name="personalityTraits"
                            render={({ field }) => (
                              <FormItem key={trait} className="flex flex-row items-start space-x-3 space-y-0">
                                <Card className="flex-1 hover-elevate">
                                  <label className="flex items-center gap-3 p-3 cursor-pointer">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(trait as any)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, trait as any]);
                                          } else {
                                            field.onChange(current.filter((t) => t !== trait));
                                          }
                                        }}
                                        data-testid={`checkbox-personality-${trait.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                      />
                                    </FormControl>
                                    <span className="text-sm">{trait}</span>
                                  </label>
                                </Card>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      
                      {/* Other Personality Trait */}
                      <FormField
                        control={form.control}
                        name="personalityTraits"
                        render={({ field }) => {
                          const hasOther = field.value?.includes('Other' as any);
                          return (
                            <div className="mt-3">
                              <Card className="hover-elevate">
                                <label className="flex items-center gap-3 p-3 cursor-pointer">
                                  <Checkbox
                                    checked={hasOther}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, 'Other' as any]);
                                      } else {
                                        field.onChange(current.filter((t) => t !== 'Other'));
                                        setCustomPersonalityOther('');
                                      }
                                    }}
                                    data-testid="checkbox-personality-other"
                                  />
                                  <span className="text-sm">Other</span>
                                </label>
                              </Card>
                              {hasOther && (
                                <div className="mt-2">
                                  <Input
                                    placeholder="Enter personality traits (e.g., ambitious, creative)"
                                    maxLength={200}
                                    value={customPersonalityOther}
                                    onChange={(e) => setCustomPersonalityOther(e.target.value)}
                                    data-testid="input-custom-personality"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {customPersonalityOther.length}/200 characters
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Interests */}
                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What are some of their main interests or hobbies?</FormLabel>
                      <FormDescription className="text-xs">e.g., hiking, gaming, cooking, reading, fashion</FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about their interests and hobbies..."
                          maxLength={500}
                          {...field}
                          data-testid="textarea-interests"
                          className="min-h-[100px] resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 2: Occasion & Relationship */}
              <div className="space-y-6 pt-6 border-t">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Occasion & Relationship</h2>
                  <p className="text-sm text-muted-foreground">Your connection to them</p>
                </div>

                {/* Relationship */}
                <FormField
                  control={form.control}
                  name="relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What's your relationship type?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-2 gap-3"
                        >
                          {['Partner', 'Family', 'Friend', 'Coworker', 'Classmate', 'Acquaintance'].map((rel) => (
                            <Card key={rel} className="hover-elevate">
                              <label className="flex items-center gap-3 p-3 cursor-pointer">
                                <RadioGroupItem value={rel} data-testid={`radio-relationship-${rel.toLowerCase()}`} />
                                <span className="text-sm">{rel}</span>
                              </label>
                            </Card>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Closeness */}
                <FormField
                  control={form.control}
                  name="closeness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How close are you?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-3 gap-3"
                        >
                          {['Very close', 'Somewhat close', 'Casual'].map((level) => (
                            <Card key={level} className="hover-elevate">
                              <label className="flex items-center gap-3 p-3 cursor-pointer">
                                <RadioGroupItem value={level} data-testid={`radio-closeness-${level.toLowerCase().replace(/\s+/g, '-')}`} />
                                <span className="text-sm">{level}</span>
                              </label>
                            </Card>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 3: Preferences & Constraints */}
              <div className="space-y-6 pt-6 border-t">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Preferences & Constraints</h2>
                  <p className="text-sm text-muted-foreground">Help us narrow down the perfect gift</p>
                </div>

                {/* Budget */}
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What's your budget range?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-budget">
                            <SelectValue placeholder="Select your budget range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Under $25">Under $25</SelectItem>
                          <SelectItem value="$25-$50">$25 - $50</SelectItem>
                          <SelectItem value="$50-$100">$50 - $100</SelectItem>
                          <SelectItem value="$100-$500">$100 - $500</SelectItem>
                          <SelectItem value="$500-$1,000">$500 - $1,000</SelectItem>
                          <SelectItem value="$1,000+">$1,000+</SelectItem>
                          <SelectItem value="$10,000+">$10,000+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gift Preferences */}
                <FormField
                  control={form.control}
                  name="giftPreferences"
                  render={() => (
                    <FormItem>
                      <FormLabel>Do they prefer:</FormLabel>
                      <FormDescription className="text-xs">Select all that apply</FormDescription>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {['Practical gifts', 'Sentimental/personalized gifts', 'Experiences', 'Funny/novelty items'].map((pref) => (
                          <FormField
                            key={pref}
                            control={form.control}
                            name="giftPreferences"
                            render={({ field }) => (
                              <FormItem key={pref} className="flex flex-row items-start space-x-3 space-y-0">
                                <Card className="flex-1 hover-elevate">
                                  <label className="flex items-center gap-3 p-3 cursor-pointer">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(pref as any)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, pref as any]);
                                          } else {
                                            field.onChange(current.filter((p) => p !== pref));
                                          }
                                        }}
                                        data-testid={`checkbox-gift-pref-${pref.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                      />
                                    </FormControl>
                                    <span className="text-sm">{pref}</span>
                                  </label>
                                </Card>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dislikes */}
                <FormField
                  control={form.control}
                  name="dislikes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Any dislikes or no-go areas?</FormLabel>
                      <FormDescription className="text-xs">e.g., no alcohol, no perfumes, avoid tech</FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="Things to avoid..."
                          maxLength={500}
                          {...field}
                          data-testid="textarea-dislikes"
                          className="min-h-[80px] resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gift Style */}
                <FormField
                  control={form.control}
                  name="giftStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you want the gift to be:</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-2 gap-3"
                        >
                          <Card className="hover-elevate">
                            <label className="flex items-center gap-3 p-3 cursor-pointer">
                              <RadioGroupItem value="unique-thoughtful" data-testid="radio-style-unique" />
                              <span className="text-sm">Unique & Thoughtful</span>
                            </label>
                          </Card>
                          <Card className="hover-elevate">
                            <label className="flex items-center gap-3 p-3 cursor-pointer">
                              <RadioGroupItem value="safe-popular" data-testid="radio-style-safe" />
                              <span className="text-sm">Safe & Popular</span>
                            </label>
                          </Card>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 4: Optional Details */}
              <div className="space-y-6 pt-6 border-t">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Optional Details</h2>
                  <p className="text-sm text-muted-foreground">Additional context for better recommendations</p>
                </div>

                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Where do they live? (city/country)</FormLabel>
                      <FormDescription className="text-xs">Helps tailor weather, regional, or store-based ideas</FormDescription>
                      <FormControl>
                        <Input
                          placeholder="e.g., San Francisco, USA"
                          maxLength={500}
                          {...field}
                          data-testid="input-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Additional Notes */}
                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anything else you'd like to mention about them?</FormLabel>
                      <FormDescription className="text-xs">
                        e.g., "They love their dog more than anything," "They recently started a new job"
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="Additional context..."
                          maxLength={2000}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setAdditionalNotesCount(e.target.value.length);
                          }}
                          data-testid="textarea-additional-notes"
                          className="min-h-[100px] resize-none"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">{additionalNotesCount}/2000 characters</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="max-w-lg mx-auto space-y-3">
          {fromContext === 'giftlist' && profileId ? (
            // Gift list context - show "Save" and "Save & Generate" buttons
            <>
              <Button
                onClick={handleSubmit(false)}
                disabled={updateMutation.isPending}
                variant="outline"
                className="w-full h-12 text-base hover-elevate active-elevate-2"
                data-testid="button-save-profile"
              >
                {updateMutation.isPending && !isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-foreground border-t-transparent rounded-full" />
                    Saving...
                  </div>
                ) : (
                  'Save'
                )}
              </Button>
              
              <Button
                onClick={handleSubmit(true)}
                disabled={updateMutation.isPending}
                className="w-full h-12 text-base hover-elevate active-elevate-2"
                data-testid="button-save-and-generate"
              >
                {updateMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Save & Generate Ideas
                  </div>
                )}
              </Button>
            </>
          ) : (
            // Normal context - show "Create Profile" and "Create + Generate" buttons
            <>
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
            </>
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
              Your current balance: <strong>{(userData?.tokens ?? 0) + (userData?.purchasedTokens ?? 0)} tokens</strong>
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

      {/* Clear All Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent data-testid="dialog-clear-all">
          <DialogHeader>
            <DialogTitle>Clear All Selections?</DialogTitle>
            <DialogDescription>
              This will reset all questionnaire fields to their default values. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              className="w-full sm:w-auto"
              data-testid="button-clear-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              className="w-full sm:w-auto"
              data-testid="button-clear-confirm"
            >
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
