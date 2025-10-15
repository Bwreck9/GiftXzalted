import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const questionnaireSchema = z.object({
  shoppingFor: z.enum(['self', 'another']),
  age: z.number().min(1).max(120),
  event: z.enum(['Birthday', 'Anniversary', 'Christmas', "Valentine's Day", 'Other']),
  gender: z.string().min(1, 'Gender is required'),
  relationship: z.string().optional(),
  personality: z.string().min(1, 'Personality is required').max(1000),
  interests: z.string().min(1, 'Interests are required').max(1000),
});

type QuestionnaireFormValues = z.infer<typeof questionnaireSchema>;

interface QuestionnaireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: QuestionnaireFormValues) => void;
  isSubmitting?: boolean;
}

export function QuestionnaireDialog({ open, onOpenChange, onSubmit, isSubmitting }: QuestionnaireDialogProps) {
  const form = useForm<QuestionnaireFormValues>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      shoppingFor: 'another',
      age: 25,
      event: 'Birthday',
      gender: '',
      relationship: '',
      personality: '',
      interests: '',
    },
  });

  const handleSubmit = (data: QuestionnaireFormValues) => {
    onSubmit(data);
  };

  const shoppingFor = form.watch('shoppingFor');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-questionnaire">
        <DialogHeader>
          <DialogTitle>Complete Questionnaire</DialogTitle>
          <DialogDescription>
            Fill out these details to generate personalized AI gift recommendations
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Shopping For */}
            <FormField
              control={form.control}
              name="shoppingFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Who are you shopping for?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="self" id="self" data-testid="radio-shopping-self" />
                        <label htmlFor="self" className="cursor-pointer">Myself</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="another" id="another" data-testid="radio-shopping-another" />
                        <label htmlFor="another" className="cursor-pointer">Someone Else</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Age Slider */}
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={120}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      data-testid="slider-age"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Event */}
            <FormField
              control={form.control}
              name="event"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event/Occasion</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-event">
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

            {/* Gender */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Female, Male, Non-binary"
                      data-testid="input-gender"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Relationship (conditional) */}
            {shoppingFor === 'another' && (
              <FormField
                control={form.control}
                name="relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Mother, Best Friend, Colleague"
                        data-testid="input-relationship"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Personality */}
            <FormField
              control={form.control}
              name="personality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personality Traits</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Outgoing, creative, loves adventure..."
                      rows={3}
                      data-testid="textarea-personality"
                    />
                  </FormControl>
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
                  <FormLabel>Interests & Hobbies</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Photography, hiking, cooking, reading sci-fi..."
                      rows={3}
                      data-testid="textarea-interests"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-questionnaire"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-submit-questionnaire"
              >
                {isSubmitting ? 'Saving...' : 'Save & Generate'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
