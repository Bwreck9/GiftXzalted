import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { insertProfileSchema, type InsertProfile, type Profile, type User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Gift, Sparkles, Coins } from 'lucide-react';
import { z } from 'zod';

const formSchema = insertProfileSchema.extend({
  userId: z.string().optional(),
});

const MAX_FREE_PROFILES = 5;
const TOKENS_PER_GENERATION = 500;

export default function ProfileForm() {
  const { id } = useParams();
  const isEdit = id !== 'new';
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: profile } = useQuery<Profile>({
    queryKey: ['/api/profiles', id],
    enabled: isEdit,
  });

  const { data: profiles } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
    enabled: !isEdit,
  });

  const { data: userData } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: profile ? {
      name: profile.name,
      shoppingFor: profile.shoppingFor as 'self' | 'another',
      age: profile.age,
      event: profile.event as any,
      gender: profile.gender,
      relationship: profile.relationship ?? '',
      personality: profile.personality,
      interests: profile.interests,
    } : {
      name: '',
      shoppingFor: 'another' as const,
      age: 25,
      event: 'Birthday' as const,
      gender: '',
      relationship: '',
      personality: '',
      interests: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ data, generateResponse }: { data: InsertProfile; generateResponse: boolean }) => {
      const res = await apiRequest('POST', '/api/profiles', { ...data, generateResponse });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({ 
        title: isGenerating ? 'Profile created with AI response!' : 'Profile created!', 
        description: isGenerating ? 'Your AI-powered gift recommendations are ready.' : 'Your profile has been saved.' 
      });
      setLocation(`/profile/${data.id}`);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create profile', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertProfile) => {
      const res = await apiRequest('PATCH', `/api/profiles/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({ title: 'Profile updated!', description: 'Your changes have been saved.' });
      setLocation('/');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    },
  });

  const handleSubmit = (generateResponse: boolean) => {
    return form.handleSubmit((data: z.infer<typeof formSchema>) => {
      const profileData: InsertProfile = {
        ...data,
        userId: user!.uid,
      };
      
      if (isEdit) {
        updateMutation.mutate(profileData);
      } else {
        // Check profile limit for free users
        const profileCount = profiles?.length || 0;
        if (profileCount >= MAX_FREE_PROFILES) {
          toast({ 
            title: 'Profile limit reached', 
            description: `You've reached the maximum of ${MAX_FREE_PROFILES} free profiles.`, 
            variant: 'destructive' 
          });
          return;
        }

        // Check token balance for premium generation
        if (generateResponse && (!userData || userData.tokens < TOKENS_PER_GENERATION)) {
          toast({ 
            title: 'Insufficient tokens', 
            description: `You need ${TOKENS_PER_GENERATION} tokens to generate AI recommendations.`, 
            variant: 'destructive' 
          });
          setLocation('/pricing');
          return;
        }

        setIsGenerating(generateResponse);
        createMutation.mutate({ data: profileData, generateResponse });
      }
    });
  };

  const shoppingFor = form.watch('shoppingFor');
  const age = form.watch('age');

  const profileCount = profiles?.length || 0;
  const hasEnoughTokens = userData && userData.tokens >= TOKENS_PER_GENERATION;
  const canCreateProfile = !isEdit && profileCount < MAX_FREE_PROFILES;

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
          <h1 className="text-lg font-semibold">
            {isEdit ? 'Edit Profile' : 'New Profile'}
          </h1>
        </div>
        {!isEdit && userData && (
          <Badge variant="secondary" className="gap-1">
            <Coins className="h-3 w-3" />
            {userData.tokens}
          </Badge>
        )}
        {isEdit && <div className="w-10" />}
      </header>

      {!isEdit && (
        <div className="border-b bg-muted/50 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Free profiles: {profileCount} / {MAX_FREE_PROFILES}
            </span>
            {profileCount >= MAX_FREE_PROFILES && (
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
          {isEdit ? (
            <Button
              onClick={handleSubmit(false)}
              disabled={updateMutation.isPending}
              className="w-full h-12 text-base hover-elevate active-elevate-2"
              data-testid="button-save-profile"
            >
              {updateMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSubmit(false)}
                disabled={createMutation.isPending || !canCreateProfile}
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
                  'Create Profile (Free)'
                )}
              </Button>
              
              <Button
                onClick={handleSubmit(true)}
                disabled={createMutation.isPending || !canCreateProfile || !hasEnoughTokens}
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

              {!hasEnoughTokens && (
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
    </div>
  );
}
