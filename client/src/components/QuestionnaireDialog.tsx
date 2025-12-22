import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertProfileSchema, type InsertProfile, type Profile } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';

// Interests organized by category
const INTERESTS_CATEGORIES = {
  'Sports & Fitness': [
    'Running', 'Yoga', 'Gym/Weightlifting', 'Swimming', 'Cycling', 'Hiking', 
    'Rock Climbing', 'Martial Arts', 'Golf', 'Tennis', 'Basketball', 'Soccer', 
    'Skiing/Snowboarding', 'Surfing'
  ],
  'Arts & Creativity': [
    'Painting', 'Drawing', 'Photography', 'Sculpting', 'Pottery', 'Graphic Design',
    'Calligraphy', 'Knitting/Crocheting', 'Sewing', 'Jewelry Making', 'Woodworking', 'DIY Crafts'
  ],
  'Music': [
    'Playing Instruments', 'Singing', 'DJing', 'Vinyl/Records', 'Concerts/Live Music',
    'Music Production'
  ],
  'Gaming & Tech': [
    'Video Games', 'Board Games', 'Card Games', 'Puzzles', 'VR/AR',
    'PC Building', 'Coding/Programming', 'Gadgets', 'Drones'
  ],
  'Food & Drink': [
    'Cooking', 'Baking', 'Grilling/BBQ', 'Wine', 'Craft Beer', 'Coffee',
    'Cocktails', 'Food Photography', 'Restaurant Exploring'
  ],
  'Outdoors & Nature': [
    'Camping', 'Fishing', 'Hunting', 'Birdwatching', 'Gardening', 'Stargazing',
    'Kayaking/Canoeing', 'Horseback Riding', 'Nature Photography'
  ],
  'Learning & Mind': [
    'Reading', 'Writing', 'Languages', 'History', 'Science', 'Philosophy',
    'Podcasts', 'Documentaries', 'Trivia'
  ],
  'Wellness & Self-Care': [
    'Meditation', 'Skincare', 'Aromatherapy', 'Journaling', 'Spa/Massage',
    'Mental Health', 'Nutrition'
  ],
  'Entertainment': [
    'Movies', 'TV/Streaming', 'Anime', 'Theater', 'Stand-up Comedy',
    'True Crime', 'Reality TV'
  ],
  'Collecting': [
    'Sneakers', 'Watches', 'Art', 'Vintage Items', 'Coins', 'Stamps',
    'Sports Memorabilia', 'Funko Pops'
  ],
  'Travel & Culture': [
    'Travel', 'Road Trips', 'Museums', 'Cultural Events', 'Theme Parks', 'Architecture'
  ],
  'Home & Lifestyle': [
    'Interior Design', 'Home Improvement', 'Organization', 'Plants', 'Smart Home', 'Pets'
  ],
  'Fashion & Beauty': [
    'Fashion', 'Streetwear', 'Makeup', 'Fragrance', 'Thrifting'
  ],
  'Social': [
    'Volunteering', 'Networking', 'Book Clubs', 'Sports Leagues', 'Parties/Hosting'
  ],
} as const;

const formSchema = insertProfileSchema.omit({
  userId: true,
  name: true,
  color: true,
});

type FormValues = z.infer<typeof formSchema>;

interface QuestionnaireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<InsertProfile>) => void;
  isSubmitting?: boolean;
  existingProfile?: Profile;
}

export function QuestionnaireDialog({ open, onOpenChange, onSubmit, isSubmitting, existingProfile }: QuestionnaireDialogProps) {
  const [customGender, setCustomGender] = useState('');
  const [customPersonalityOther, setCustomPersonalityOther] = useState('');
  const [additionalNotesCount, setAdditionalNotesCount] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterestsOther, setCustomInterestsOther] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ageRange: undefined,
      gender: undefined,
      personalityTraits: [],
      interests: undefined,
      relationship: undefined,
      closeness: undefined,
      dislikes: undefined,
      location: undefined,
      additionalNotes: undefined,
    },
  });

  // Pre-fill form when existingProfile changes
  useEffect(() => {
    if (existingProfile) {
      form.reset({
        ageRange: existingProfile.ageRange as any,
        gender: existingProfile.gender as any,
        personalityTraits: (existingProfile.personalityTraits || []) as any,
        interests: existingProfile.interests || undefined,
        relationship: existingProfile.relationship as any,
        closeness: existingProfile.closeness as any,
        dislikes: existingProfile.dislikes || undefined,
        location: existingProfile.location || undefined,
        additionalNotes: existingProfile.additionalNotes || undefined,
      });
      setAdditionalNotesCount(existingProfile.additionalNotes?.length || 0);
      
      // Parse existing interests string to array
      if (existingProfile.interests) {
        const allKnownInterests: string[] = Object.values(INTERESTS_CATEGORIES).flat();
        const parsed = existingProfile.interests.split(',').map(s => s.trim()).filter(Boolean);
        const known: string[] = [];
        const custom: string[] = [];
        parsed.forEach(interest => {
          if (allKnownInterests.includes(interest)) {
            known.push(interest);
          } else if (interest === 'Other') {
            // Skip the "Other" marker itself
          } else {
            custom.push(interest);
          }
        });
        setSelectedInterests(known.length > 0 || custom.length > 0 ? [...known, ...(custom.length > 0 ? ['Other'] : [])] : []);
        setCustomInterestsOther(custom.join(', '));
      } else {
        setSelectedInterests([]);
        setCustomInterestsOther('');
      }
    }
  }, [existingProfile, form]);

  const handleSubmit = (data: FormValues) => {
    // Convert selectedInterests array to comma-separated string
    const interestsWithoutOther = selectedInterests.filter(i => i !== 'Other');
    const customInterestsArray = customInterestsOther.split(',').map(s => s.trim()).filter(Boolean);
    const allInterests = [...interestsWithoutOther, ...customInterestsArray];
    
    const submitData = {
      ...data,
      interests: allInterests.length > 0 ? allInterests.join(', ') : undefined,
      ...(data.personalityTraits?.includes('Other') && customPersonalityOther ? { customPersonalityOther } : {}),
    };
    onSubmit(submitData);
    onOpenChange(false);
  };

  const gender = form.watch('gender');
  const personalityTraits = form.watch('personalityTraits');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-questionnaire">
        <DialogHeader>
          <DialogTitle>Train Agent</DialogTitle>
          <DialogDescription>
            Help our AI understand {existingProfile?.name || 'this person'} better by answering these questions
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-6">
              {/* Age Range */}
              <FormField
                control={form.control}
                name="ageRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What's {existingProfile?.name ? `${existingProfile.name}'s` : 'their'} age range?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                      >
                        {['Child (0-12)', 'Teen (13-19)', 'Young Adult (20-30)', 'Adult 1 (31-50)', 'Adult 2 (51-70)', 'Senior 70+'].map((age) => (
                          <Card key={age} className="hover-elevate">
                            <label className="flex items-center gap-2 p-3 cursor-pointer">
                              <RadioGroupItem 
                                value={age} 
                                id={`age-${age}`}
                                data-testid={`radio-age-${age.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                              />
                              <span className="text-sm">{age}</span>
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
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 gap-3"
                      >
                        {['Male', 'Female', 'Other'].map((g) => (
                          <Card key={g} className="hover-elevate">
                            <label className="flex items-center gap-2 p-3 cursor-pointer">
                              <RadioGroupItem 
                                value={g} 
                                id={`gender-${g}`}
                                data-testid={`radio-gender-${g.toLowerCase()}`}
                              />
                              <span className="text-sm">{g}</span>
                            </label>
                          </Card>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    {gender === 'Other' && (
                      <div className="mt-2">
                        <Input
                          placeholder="Please specify..."
                          value={customGender}
                          onChange={(e) => {
                            setCustomGender(e.target.value);
                            field.onChange(e.target.value);
                          }}
                          maxLength={500}
                          data-testid="input-custom-gender"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Our AI is inclusive and understands all gender identities</p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personality Traits - Organized by Category */}
              <FormField
                control={form.control}
                name="personalityTraits"
                render={() => (
                  <FormItem>
                    <FormLabel>How would you describe {existingProfile?.name ? `${existingProfile.name}'s` : 'their'} personality?</FormLabel>
                    
                    {/* Social/Lifestyle */}
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Social & Lifestyle</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['Adventurous', 'Homebody', 'Outdoorsy', 'Foodie', 'Wellness-focused', 'Social butterfly', 'Party lover'].map((trait) => (
                          <FormField
                            key={trait}
                            control={form.control}
                            name="personalityTraits"
                            render={({ field }) => (
                              <Card className="hover-elevate">
                                <label className="flex items-center gap-2 p-2 cursor-pointer">
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
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Energy/Temperament */}
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Energy & Temperament</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['Introverted', 'Outgoing', 'Laid-back', 'Energetic', 'Romantic', 'Funny/Lighthearted'].map((trait) => (
                          <FormField
                            key={trait}
                            control={form.control}
                            name="personalityTraits"
                            render={({ field }) => (
                              <Card className="hover-elevate">
                                <label className="flex items-center gap-2 p-2 cursor-pointer">
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
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Mind/Work Style */}
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Mind & Work Style</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['Thoughtful', 'Analytical', 'Creative', 'Curious', 'Ambitious', 'Organized', 'Tech-savvy'].map((trait) => (
                          <FormField
                            key={trait}
                            control={form.control}
                            name="personalityTraits"
                            render={({ field }) => (
                              <Card className="hover-elevate">
                                <label className="flex items-center gap-2 p-2 cursor-pointer">
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
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Values/Identity */}
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Values & Identity</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['Sentimental', 'Minimalist', 'Eco-conscious', 'Spiritual', 'Trendy/Fashion-forward', 'Nostalgic', 'Artistic'].map((trait) => (
                          <FormField
                            key={trait}
                            control={form.control}
                            name="personalityTraits"
                            render={({ field }) => (
                              <Card className="hover-elevate">
                                <label className="flex items-center gap-2 p-2 cursor-pointer">
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
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Interests-based */}
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Interests-based</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['Bookworm', 'Sports enthusiast', 'Music lover', 'Gamer', 'DIY/Crafty', 'Collector', 'Pet lover'].map((trait) => (
                          <FormField
                            key={trait}
                            control={form.control}
                            name="personalityTraits"
                            render={({ field }) => (
                              <Card className="hover-elevate">
                                <label className="flex items-center gap-2 p-2 cursor-pointer">
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
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Other */}
                    <div className="mt-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <FormField
                          control={form.control}
                          name="personalityTraits"
                          render={({ field }) => (
                            <Card className="hover-elevate">
                              <label className="flex items-center gap-2 p-2 cursor-pointer">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes('Other' as any)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, 'Other' as any]);
                                      } else {
                                        field.onChange(current.filter((t) => t !== 'Other'));
                                      }
                                    }}
                                    data-testid="checkbox-personality-other"
                                  />
                                </FormControl>
                                <span className="text-sm">Other</span>
                              </label>
                            </Card>
                          )}
                        />
                      </div>
                      {personalityTraits?.includes('Other') && (
                        <div className="mt-2">
                          <Input
                            placeholder="Describe their personality..."
                            value={customPersonalityOther}
                            onChange={(e) => setCustomPersonalityOther(e.target.value)}
                            maxLength={200}
                            data-testid="input-custom-personality"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Keep it concise - use keywords, not sentences</p>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Interests - Organized by Category */}
              <FormItem>
                <FormLabel>What are some of {existingProfile?.name ? `${existingProfile.name}'s` : 'their'} interests or hobbies?</FormLabel>
                
                {Object.entries(INTERESTS_CATEGORIES).map(([category, interests]) => (
                  <div key={category} className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">{category}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {interests.map((interest) => (
                        <Card key={interest} className="hover-elevate">
                          <label className="flex items-center gap-2 p-2 cursor-pointer">
                            <Checkbox
                              checked={selectedInterests.includes(interest)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedInterests(prev => [...prev, interest]);
                                } else {
                                  setSelectedInterests(prev => prev.filter(i => i !== interest));
                                }
                              }}
                              data-testid={`checkbox-interest-${interest.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            />
                            <span className="text-sm">{interest}</span>
                          </label>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Other interests */}
                <div className="mt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <Card className="hover-elevate">
                      <label className="flex items-center gap-2 p-2 cursor-pointer">
                        <Checkbox
                          checked={selectedInterests.includes('Other')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedInterests(prev => [...prev, 'Other']);
                            } else {
                              setSelectedInterests(prev => prev.filter(i => i !== 'Other'));
                            }
                          }}
                          data-testid="checkbox-interest-other"
                        />
                        <span className="text-sm">Other</span>
                      </label>
                    </Card>
                  </div>
                  {selectedInterests.includes('Other') && (
                    <div className="mt-2">
                      <Input
                        placeholder="List other interests (comma-separated)..."
                        value={customInterestsOther}
                        onChange={(e) => setCustomInterestsOther(e.target.value)}
                        maxLength={300}
                        data-testid="input-custom-interests"
                      />
                      <p className="text-xs text-muted-foreground mt-1">e.g., Bonsai, Lockpicking, Urban Exploration</p>
                    </div>
                  )}
                </div>
              </FormItem>

              {/* Relationship */}
              <FormField
                control={form.control}
                name="relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What's your relationship to {existingProfile?.name || 'them'}?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                      >
                        {['Partner', 'Family', 'Friend', 'Coworker', 'Acquaintance', 'Classmate'].map((rel) => (
                          <Card key={rel} className="hover-elevate">
                            <label className="flex items-center gap-2 p-3 cursor-pointer">
                              <RadioGroupItem 
                                value={rel} 
                                id={`rel-${rel}`}
                                data-testid={`radio-relationship-${rel.toLowerCase()}`}
                              />
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
                        {['Very close', 'Somewhat close', 'Casual'].map((close) => (
                          <Card key={close} className="hover-elevate">
                            <label className="flex items-center gap-2 p-3 cursor-pointer">
                              <RadioGroupItem 
                                value={close} 
                                id={`close-${close}`}
                                data-testid={`radio-closeness-${close.toLowerCase().replace(/\s/g, '-')}`}
                              />
                              <span className="text-sm">{close}</span>
                            </label>
                          </Card>
                        ))}
                      </RadioGroup>
                    </FormControl>
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
                        className="min-h-[60px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Where do they live? (optional)</FormLabel>
                    <FormDescription className="text-xs">Helps with local availability</FormDescription>
                    <FormControl>
                      <Input
                        placeholder="e.g., Seattle, WA or London, UK"
                        maxLength={100}
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
                        className="min-h-[80px] resize-none"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{additionalNotesCount}/2000 characters</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel-questionnaire"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
                data-testid="button-submit-questionnaire"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
