import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Lock, X } from 'lucide-react';
import { useLocation } from 'wouter';

interface PreviewQuestionnaireModalProps {
  open: boolean;
  onClose: () => void;
}

export function PreviewQuestionnaireModal({ open, onClose }: PreviewQuestionnaireModalProps) {
  const [, setLocation] = useLocation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto p-0">
        {/* Header with Lock Banner */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">🔒 AI Training Required</h3>
                <p className="text-sm text-white/90">Preview of our comprehensive questionnaire. Get AI recommendations by training a profile!</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
              data-testid="preview-modal-close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Preview Form Content */}
        <div className="relative p-6">
          {/* Light overlay for non-interactive appearance */}
          <div className="absolute inset-0 bg-white/30 dark:bg-black/30 z-10 pointer-events-none" />
          
          <div className="space-y-6 relative">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Gift Profile Questionnaire</h2>
              <p className="text-muted-foreground">Preview only — create a profile to use this feature.</p>
            </div>

            {/* Form Fields - All Disabled */}
            <div className="space-y-6">
              {/* Section 1: About the Recipient */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">About the Recipient</h3>
                  <p className="text-xs text-muted-foreground">Tell us about the person you're shopping for</p>
                </div>

                <div className="space-y-2">
                  <Label>Profile Name</Label>
                  <Input
                    disabled
                    placeholder="e.g., Sarah, Mom, Best Friend"
                    className="cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Who is this profile for?</p>
                </div>

                <div className="space-y-2">
                  <Label>Age Range</Label>
                  <RadioGroup disabled value="">
                    <div className="grid grid-cols-2 gap-2">
                      {['Child (0-12)', 'Teen (13-19)', 'Young Adult (20-30)', 'Adult 1 (31-50)', 'Adult 2 (51-70)', 'Senior 70+'].map((range) => (
                        <Card key={range} className="opacity-60">
                          <label className="flex items-center gap-2 p-2 cursor-not-allowed">
                            <RadioGroupItem value={range} disabled />
                            <span className="text-xs">{range}</span>
                          </label>
                        </Card>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Gender Identity (optional)</Label>
                  <Select disabled>
                    <SelectTrigger className="cursor-not-allowed">
                      <SelectValue placeholder="Select gender identity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>How would you describe their personality?</Label>
                  <p className="text-xs text-muted-foreground">Select all that apply</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Adventurous', 'Thoughtful', 'Funny/Lighthearted', 'Introverted', 'Outgoing', 'Artistic', 'Tech-savvy', 'Sentimental'].map((trait) => (
                      <Card key={trait} className="opacity-60">
                        <label className="flex items-center gap-2 p-2 cursor-not-allowed">
                          <Checkbox disabled />
                          <span className="text-xs">{trait}</span>
                        </label>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>What are some of their main interests or hobbies?</Label>
                  <p className="text-xs text-muted-foreground">e.g., hiking, gaming, cooking, reading, fashion</p>
                  <Textarea
                    disabled
                    placeholder="Tell us about their interests and hobbies..."
                    rows={2}
                    className="cursor-not-allowed resize-none"
                  />
                </div>
              </div>

              {/* Section 2: Occasion & Relationship */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Occasion & Relationship</h3>
                  <p className="text-xs text-muted-foreground">Your connection to them</p>
                </div>

                <div className="space-y-2">
                  <Label>What's your relationship to them?</Label>
                  <RadioGroup disabled value="">
                    <div className="grid grid-cols-2 gap-2">
                      {['Partner', 'Family', 'Friend', 'Coworker', 'Classmate', 'Acquaintance'].map((rel) => (
                        <Card key={rel} className="opacity-60">
                          <label className="flex items-center gap-2 p-2 cursor-not-allowed">
                            <RadioGroupItem value={rel} disabled />
                            <span className="text-xs">{rel}</span>
                          </label>
                        </Card>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>How close are you?</Label>
                  <RadioGroup disabled value="">
                    <div className="grid grid-cols-3 gap-2">
                      {['Very close', 'Somewhat close', 'Casual'].map((level) => (
                        <Card key={level} className="opacity-60">
                          <label className="flex items-center gap-2 p-2 cursor-not-allowed">
                            <RadioGroupItem value={level} disabled />
                            <span className="text-xs">{level}</span>
                          </label>
                        </Card>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Section 3: Preferences & Constraints */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Preferences & Constraints</h3>
                  <p className="text-xs text-muted-foreground">Help us narrow down the perfect gift</p>
                </div>

                <div className="space-y-2">
                  <Label>What's your budget range?</Label>
                  <Select disabled>
                    <SelectTrigger className="cursor-not-allowed">
                      <SelectValue placeholder="Select your budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-25">Under $25</SelectItem>
                      <SelectItem value="25-50">$25 - $50</SelectItem>
                      <SelectItem value="50-100">$50 - $100</SelectItem>
                      <SelectItem value="100-500">$100 - $500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Do they prefer:</Label>
                  <p className="text-xs text-muted-foreground">Select all that apply</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Practical gifts', 'Sentimental/personalized gifts', 'Experiences', 'Funny/novelty items'].map((pref) => (
                      <Card key={pref} className="opacity-60">
                        <label className="flex items-center gap-2 p-2 cursor-not-allowed">
                          <Checkbox disabled />
                          <span className="text-xs">{pref}</span>
                        </label>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Any dislikes or no-go areas?</Label>
                  <p className="text-xs text-muted-foreground">e.g., no alcohol, no perfumes, avoid tech</p>
                  <Textarea
                    disabled
                    placeholder="Things to avoid..."
                    rows={2}
                    className="cursor-not-allowed resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Do you want the gift to be:</Label>
                  <RadioGroup disabled value="">
                    <div className="grid grid-cols-2 gap-2">
                      <Card className="opacity-60">
                        <label className="flex items-center gap-2 p-2 cursor-not-allowed">
                          <RadioGroupItem value="unique" disabled />
                          <span className="text-xs">Unique & Thoughtful</span>
                        </label>
                      </Card>
                      <Card className="opacity-60">
                        <label className="flex items-center gap-2 p-2 cursor-not-allowed">
                          <RadioGroupItem value="safe" disabled />
                          <span className="text-xs">Safe & Popular</span>
                        </label>
                      </Card>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  disabled
                  className="w-full cursor-not-allowed pointer-events-none"
                  size="lg"
                >
                  Train AI Agent (Preview Only)
                </Button>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground italic">
              *This is a preview. All fields are disabled.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="sticky bottom-0 bg-card border-t p-6 space-y-3 rounded-b-lg">
          <div className="flex gap-3">
            <Button
              onClick={() => {
                onClose();
                setLocation('/pricing?highlight=buytokens');
              }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white border-0"
              data-testid="preview-buy-tokens"
            >
              Buy Tokens
            </Button>
            <Button
              onClick={() => {
                onClose();
                setLocation('/pricing?highlight=subscription');
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white border-0"
              data-testid="preview-subscribe"
            >
              Subscribe
            </Button>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
            data-testid="preview-close"
          >
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
