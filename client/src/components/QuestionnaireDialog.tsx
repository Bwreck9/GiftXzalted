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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
        budget: existingProfile.budget as any,
        giftPreferences: (existingProfile.giftPreferences || []) as any,
        dislikes: existingProfile.dislikes || undefined,
        giftStyle: existingProfile.giftStyle as any,
        location: existingProfile.location || undefined,
        additionalNotes: existingProfile.additionalNotes || undefined,
      });
      setAdditionalNotesCount(existingProfile.additionalNotes?.length || 0);
    }
  }, [existingProfile, form]);

  const handleSubmit = (data: FormValues) => {
    const submitData = {
      ...data,
      ...(data.personalityTraits?.includes('Other') && customPersonalityOther ? { customPersonalityOther } : {}),
    };
    onSubmit(submitData);
    onOpenChange(false);
  };

  const gender = form.watch('gender');
  const personalityTraits = form.watch('personalityTraits');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-questionnaire">
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

              {/* Personality Traits */}
              <FormField
                control={form.control}
                name="personalityTraits"
                render={() => (
                  <FormItem>
                    <FormLabel>How would you describe {existingProfile?.name ? `${existingProfile.name}'s` : 'their'} personality?</FormLabel>
                    <FormDescription className="text-xs">Select all that apply</FormDescription>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {['Adventurous', 'Thoughtful', 'Funny/Lighthearted', 'Introverted', 'Outgoing', 'Artistic', 'Tech-savvy', 'Sentimental', 'Other'].map((trait) => (
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
                    {personalityTraits?.includes('Other') && (
                      <div className="mt-3">
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
                        className="min-h-[80px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              {/* Budget */}
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What's your budget range for gifts?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-budget">
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Under $25">Under $25</SelectItem>
                        <SelectItem value="$25-$50">$25-$50</SelectItem>
                        <SelectItem value="$50-$100">$50-$100</SelectItem>
                        <SelectItem value="$100-$500">$100-$500</SelectItem>
                        <SelectItem value="$500-$1,000">$500-$1,000</SelectItem>
                        <SelectItem value="$1,000-$10,000">$1,000-$10,000</SelectItem>
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
                        className="min-h-[60px] resize-none"
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
                          <label className="flex items-center gap-2 p-3 cursor-pointer">
                            <RadioGroupItem 
                              value="unique-thoughtful" 
                              id="style-unique"
                              data-testid="radio-gift-style-unique-thoughtful"
                            />
                            <span className="text-sm">Unique & Thoughtful</span>
                          </label>
                        </Card>
                        <Card className="hover-elevate">
                          <label className="flex items-center gap-2 p-3 cursor-pointer">
                            <RadioGroupItem 
                              value="safe-popular" 
                              id="style-safe"
                              data-testid="radio-gift-style-safe-popular"
                            />
                            <span className="text-sm">Safe & Popular</span>
                          </label>
                        </Card>
                      </RadioGroup>
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
