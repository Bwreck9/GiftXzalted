import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
                <h3 className="font-semibold">🔒 Tokens Required</h3>
                <p className="text-sm text-white/90">Premium questionnaire access requires tokens. Subscribe or buy tokens to unlock.</p>
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
          {/* Semi-transparent overlay */}
          <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] z-10 pointer-events-none" />
          
          <div className="space-y-6 relative">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Premium Gift Questionnaire</h2>
              <p className="text-muted-foreground">Preview only — unlock full access with tokens.</p>
            </div>

            {/* Form Fields - All Disabled */}
            <div className="space-y-4 opacity-50">
              <div className="space-y-2">
                <Label>Recipient Name *</Label>
                <Input
                  disabled
                  placeholder="e.g., Emily"
                  className="cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label>Shopping For *</Label>
                <RadioGroup disabled className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="self" disabled />
                    <Label className="cursor-not-allowed">Myself</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="another" disabled />
                    <Label className="cursor-not-allowed">Someone else</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age *</Label>
                  <Input
                    type="number"
                    disabled
                    placeholder="25"
                    className="cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select disabled>
                    <SelectTrigger className="cursor-not-allowed">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Event/Occasion *</Label>
                <Select disabled>
                  <SelectTrigger className="cursor-not-allowed">
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="christmas">Christmas</SelectItem>
                    <SelectItem value="valentines">Valentine's Day</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Relationship (if for someone else)</Label>
                <Input
                  disabled
                  placeholder="e.g., Sister, Friend, Colleague"
                  className="cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label>Personality & Traits *</Label>
                <Textarea
                  disabled
                  placeholder="Describe their personality, style, and what makes them unique..."
                  rows={3}
                  className="cursor-not-allowed resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Interests & Hobbies *</Label>
                <Textarea
                  disabled
                  placeholder="What do they love to do? What are they passionate about?"
                  rows={3}
                  className="cursor-not-allowed resize-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  disabled
                  className="w-full cursor-not-allowed pointer-events-none opacity-50"
                  size="lg"
                >
                  Submit Questionnaire (Locked)
                </Button>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground italic">
              *Fields are disabled in preview mode.
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
