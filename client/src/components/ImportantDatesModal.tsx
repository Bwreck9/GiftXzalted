import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@shared/schema';

interface ImportantDatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onSave?: (updates: Partial<Profile>) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface DateEntry {
  name: string;
  month: string;
  day: string;
  year: string;
  showOnCard: boolean;
}

function parseMMDD(mmdd: string | null | undefined): { month: string; day: string } {
  if (!mmdd) return { month: '', day: '' };
  const [month, day] = mmdd.split('-');
  return { month: month || '', day: day || '' };
}

function formatMMDD(month: string, day: string): string | undefined {
  if (!month || !day) return undefined;
  return `${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function ImportantDatesModal({ 
  open, 
  onOpenChange, 
  profile,
  onSave,
}: ImportantDatesModalProps) {
  const [dates, setDates] = useState<DateEntry[]>([]);
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const countShowOnCard = () => {
    return dates.filter(d => d.showOnCard && d.month && d.day).length;
  };

  const canAddShowOnCard = countShowOnCard() < 3;

  // Rehydrate state when modal opens or when profile data changes
  useEffect(() => {
    if (profile && open) {
      const importantDatesData = profile.importantDates || [];
      const existingDates = importantDatesData.map(d => {
        const parsed = parseMMDD(d.date);
        return {
          name: d.name,
          month: parsed.month,
          day: parsed.day,
          year: d.year || '',
          showOnCard: d.showOnCard || false
        };
      });
      
      // If no dates exist, pre-populate with Birthday and Anniversary
      if (existingDates.length === 0) {
        setDates([
          { name: 'Birthday', month: '', day: '', year: '', showOnCard: false },
          { name: 'Anniversary', month: '', day: '', year: '', showOnCard: false }
        ]);
      } else {
        setDates(existingDates);
      }
    }
  }, [profile?.id, profile?.importantDates, open]);

  if (!profile) return null;

  const handleAddDate = () => {
    setDates([...dates, { name: '', month: '', day: '', year: '', showOnCard: false }]);
  };

  const handleRemoveDate = (index: number) => {
    setDates(dates.filter((_, i) => i !== index));
  };

  const handleUpdateDate = (index: number, field: keyof DateEntry, value: string | boolean) => {
    const updated = [...dates];
    updated[index] = { ...updated[index], [field]: value };
    setDates(updated);
  };

  const handleToggleShowOnCard = (index: number, checked: boolean) => {
    if (checked && !canAddShowOnCard) {
      toast({ title: 'Maximum 3 dates can be shown on card', description: 'Uncheck another date first' });
      return;
    }
    handleUpdateDate(index, 'showOnCard', checked);
  };

  const handleSave = () => {
    // Convert dates to the format expected by the database
    // Only save dates that have at least month and day filled in
    const formattedDates = dates
      .filter(d => d.name.trim() && d.month && d.day)
      .map(d => ({
        name: d.name.trim(),
        date: formatMMDD(d.month, d.day)!,
        year: d.year || undefined,
        showOnCard: d.showOnCard || undefined
      }));

    onSave?.({
      importantDates: formattedDates,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="important-dates-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Important Dates
          </DialogTitle>
          <DialogDescription>
            Track special dates for {profile.name}. Check up to 3 dates to display on the profile card.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {dates.map((date, index) => (
            <div key={index} className="space-y-2 p-3 rounded-md border border-border">
              <div className="flex items-center gap-2">
                {/* Show on card checkbox */}
                {date.month && date.day && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Checkbox
                      id={`show-${index}`}
                      checked={date.showOnCard}
                      onCheckedChange={(checked) => handleToggleShowOnCard(index, checked as boolean)}
                      data-testid={`dates-show-${index}`}
                    />
                    <label htmlFor={`show-${index}`} className="text-xs text-muted-foreground whitespace-nowrap">
                      Show
                    </label>
                  </div>
                )}
                
                {/* Name input */}
                <Input
                  value={date.name}
                  onChange={(e) => handleUpdateDate(index, 'name', e.target.value)}
                  placeholder="Date name (e.g., Birthday)"
                  className="flex-1"
                  data-testid={`dates-name-${index}`}
                />
                
                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveDate(index)}
                  className="hover-elevate h-9 w-9 text-destructive shrink-0"
                  data-testid={`dates-remove-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {/* Month dropdown */}
                <select
                  value={date.month}
                  onChange={(e) => handleUpdateDate(index, 'month', e.target.value)}
                  className="flex-1 min-w-[100px] h-9 rounded-md border border-input bg-background px-3 text-sm"
                  data-testid={`dates-month-${index}`}
                >
                  <option value="">Month</option>
                  {MONTHS.map((month, idx) => (
                    <option key={month} value={(idx + 1).toString().padStart(2, '0')}>
                      {month}
                    </option>
                  ))}
                </select>
                
                {/* Day input */}
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={date.day}
                  onChange={(e) => handleUpdateDate(index, 'day', e.target.value)}
                  placeholder="Day"
                  className="w-20"
                  data-testid={`dates-day-${index}`}
                />
                
                {/* Year input */}
                <Input
                  type="number"
                  min="1900"
                  max={currentYear + 10}
                  value={date.year}
                  onChange={(e) => handleUpdateDate(index, 'year', e.target.value)}
                  placeholder="Year"
                  className="w-24"
                  data-testid={`dates-year-${index}`}
                />
              </div>
            </div>
          ))}

          {/* Add Date Button */}
          <Button
            onClick={handleAddDate}
            variant="outline"
            className="w-full hover-elevate"
            data-testid="dates-add-new"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Date
          </Button>

          {/* Show on card counter */}
          <p className="text-xs text-muted-foreground text-center">
            {countShowOnCard()}/3 dates selected to show on profile card
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="dates-cancel">
            Cancel
          </Button>
          <Button onClick={handleSave} className="hover-elevate active-elevate-2" data-testid="dates-save">
            Save Dates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
