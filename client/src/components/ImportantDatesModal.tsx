import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Calendar, Plus, Trash2 } from 'lucide-react';
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

function parseMMDD(mmdd: string | null | undefined): { month: string; day: string } {
  if (!mmdd) return { month: '', day: '' };
  const [month, day] = mmdd.split('-');
  return { month: month || '', day: day || '' };
}

function formatMMDD(month: string, day: string): string | undefined {
  if (!month || !day) return undefined;
  return `${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

interface CustomDateState {
  name: string;
  month: string;
  day: string;
  year: string;
  showOnCard: boolean;
}

export function ImportantDatesModal({ 
  open, 
  onOpenChange, 
  profile,
  onSave,
}: ImportantDatesModalProps) {
  const [birthdayMonth, setBirthdayMonth] = useState('');
  const [birthdayDay, setBirthdayDay] = useState('');
  const [birthdayYear, setBirthdayYear] = useState('');
  const [birthdayShowOnCard, setBirthdayShowOnCard] = useState(false);
  
  const [anniversaryMonth, setAnniversaryMonth] = useState('');
  const [anniversaryDay, setAnniversaryDay] = useState('');
  const [anniversaryYear, setAnniversaryYear] = useState('');
  const [anniversaryShowOnCard, setAnniversaryShowOnCard] = useState(false);
  
  const [customDates, setCustomDates] = useState<CustomDateState[]>([]);
  const [newDateName, setNewDateName] = useState('');

  const countShowOnCard = () => {
    let count = 0;
    if (birthdayShowOnCard && birthdayMonth && birthdayDay) count++;
    if (anniversaryShowOnCard && anniversaryMonth && anniversaryDay) count++;
    count += customDates.filter(cd => cd.showOnCard && cd.month && cd.day).length;
    return count;
  };

  const canAddShowOnCard = countShowOnCard() < 3;

  useEffect(() => {
    if (profile && open) {
      const birthday = parseMMDD(profile.birthdayDate);
      setBirthdayMonth(birthday.month);
      setBirthdayDay(birthday.day);
      setBirthdayYear(profile.birthdayYear || '');
      setBirthdayShowOnCard(profile.birthdayShowOnCard || false);
      
      const anniversary = parseMMDD(profile.anniversaryDate);
      setAnniversaryMonth(anniversary.month);
      setAnniversaryDay(anniversary.day);
      setAnniversaryYear(profile.anniversaryYear || '');
      setAnniversaryShowOnCard(profile.anniversaryShowOnCard || false);
      
      const existingCustomDates = (profile.customDates || []).map(cd => {
        const parsed = parseMMDD(cd.date);
        return { 
          name: cd.name, 
          month: parsed.month, 
          day: parsed.day,
          year: cd.year || '',
          showOnCard: cd.showOnCard || false
        };
      });
      setCustomDates(existingCustomDates);
      setNewDateName('');
    }
  }, [profile, open]);

  if (!profile) return null;

  const handleAddCustomDate = () => {
    if (!newDateName.trim()) return;
    setCustomDates([...customDates, { name: newDateName.trim(), month: '', day: '', year: '', showOnCard: false }]);
    setNewDateName('');
  };

  const handleRemoveCustomDate = (index: number) => {
    setCustomDates(customDates.filter((_, i) => i !== index));
  };

  const handleUpdateCustomDate = (index: number, field: keyof CustomDateState, value: string | boolean) => {
    const updated = [...customDates];
    updated[index] = { ...updated[index], [field]: value };
    setCustomDates(updated);
  };

  const handleSave = () => {
    const formattedCustomDates = customDates
      .filter(cd => cd.month && cd.day)
      .map(cd => ({
        name: cd.name,
        date: formatMMDD(cd.month, cd.day)!,
        year: cd.year || undefined,
        showOnCard: cd.showOnCard || undefined
      }));

    onSave?.({
      birthdayDate: formatMMDD(birthdayMonth, birthdayDay),
      birthdayYear: birthdayYear || undefined,
      birthdayShowOnCard: birthdayShowOnCard,
      anniversaryDate: formatMMDD(anniversaryMonth, anniversaryDay),
      anniversaryYear: anniversaryYear || undefined,
      anniversaryShowOnCard: anniversaryShowOnCard,
      customDates: formattedCustomDates.length > 0 ? formattedCustomDates : undefined,
    });
    onOpenChange(false);
  };

  const currentYear = new Date().getFullYear();

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

        <div className="space-y-4 py-2">
          {/* Birthday */}
          <div className="space-y-2 p-3 rounded-md border border-border">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Birthday</Label>
              {birthdayMonth && birthdayDay && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="birthday-show"
                    checked={birthdayShowOnCard}
                    onCheckedChange={(checked) => {
                      if (checked && !canAddShowOnCard) return;
                      setBirthdayShowOnCard(checked as boolean);
                    }}
                    disabled={!birthdayShowOnCard && !canAddShowOnCard}
                    data-testid="dates-birthday-show"
                  />
                  <Label htmlFor="birthday-show" className="text-xs text-muted-foreground">Show on card</Label>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={birthdayMonth}
                onChange={(e) => setBirthdayMonth(e.target.value)}
                className="flex-1 min-w-[100px] h-9 rounded-md border border-input bg-background px-3 text-sm"
                data-testid="dates-birthday-month"
              >
                <option value="">Month</option>
                {MONTHS.map((month, idx) => (
                  <option key={month} value={(idx + 1).toString().padStart(2, '0')}>
                    {month}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min="1"
                max="31"
                value={birthdayDay}
                onChange={(e) => setBirthdayDay(e.target.value)}
                placeholder="Day"
                className="w-20"
                data-testid="dates-birthday-day"
              />
              <Input
                type="number"
                min="1900"
                max={currentYear}
                value={birthdayYear}
                onChange={(e) => setBirthdayYear(e.target.value)}
                placeholder="Year (optional)"
                className="w-32"
                data-testid="dates-birthday-year"
              />
              {(birthdayMonth || birthdayDay) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setBirthdayMonth(''); setBirthdayDay(''); setBirthdayYear(''); setBirthdayShowOnCard(false); }}
                  className="hover-elevate h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Anniversary */}
          <div className="space-y-2 p-3 rounded-md border border-border">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Anniversary</Label>
              {anniversaryMonth && anniversaryDay && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="anniversary-show"
                    checked={anniversaryShowOnCard}
                    onCheckedChange={(checked) => {
                      if (checked && !canAddShowOnCard) return;
                      setAnniversaryShowOnCard(checked as boolean);
                    }}
                    disabled={!anniversaryShowOnCard && !canAddShowOnCard}
                    data-testid="dates-anniversary-show"
                  />
                  <Label htmlFor="anniversary-show" className="text-xs text-muted-foreground">Show on card</Label>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={anniversaryMonth}
                onChange={(e) => setAnniversaryMonth(e.target.value)}
                className="flex-1 min-w-[100px] h-9 rounded-md border border-input bg-background px-3 text-sm"
                data-testid="dates-anniversary-month"
              >
                <option value="">Month</option>
                {MONTHS.map((month, idx) => (
                  <option key={month} value={(idx + 1).toString().padStart(2, '0')}>
                    {month}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min="1"
                max="31"
                value={anniversaryDay}
                onChange={(e) => setAnniversaryDay(e.target.value)}
                placeholder="Day"
                className="w-20"
                data-testid="dates-anniversary-day"
              />
              <Input
                type="number"
                min="1900"
                max={currentYear}
                value={anniversaryYear}
                onChange={(e) => setAnniversaryYear(e.target.value)}
                placeholder="Year (optional)"
                className="w-32"
                data-testid="dates-anniversary-year"
              />
              {(anniversaryMonth || anniversaryDay) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setAnniversaryMonth(''); setAnniversaryDay(''); setAnniversaryYear(''); setAnniversaryShowOnCard(false); }}
                  className="hover-elevate h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Custom Dates */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium">Custom Dates</Label>
          </div>

          {customDates.map((cd, index) => (
            <div key={index} className="space-y-2 p-3 rounded-md border border-border">
              <div className="flex items-center gap-2">
                <Input
                  value={cd.name}
                  onChange={(e) => handleUpdateCustomDate(index, 'name', e.target.value)}
                  placeholder="Date name"
                  className="flex-1"
                  data-testid={`dates-custom-name-${index}`}
                />
                {cd.month && cd.day && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`custom-show-${index}`}
                      checked={cd.showOnCard}
                      onCheckedChange={(checked) => {
                        if (checked && !canAddShowOnCard) return;
                        handleUpdateCustomDate(index, 'showOnCard', checked as boolean);
                      }}
                      disabled={!cd.showOnCard && !canAddShowOnCard}
                      data-testid={`dates-custom-show-${index}`}
                    />
                    <Label htmlFor={`custom-show-${index}`} className="text-xs text-muted-foreground whitespace-nowrap">Show</Label>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCustomDate(index)}
                  className="hover-elevate h-9 w-9 text-destructive"
                  data-testid={`dates-custom-remove-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={cd.month}
                  onChange={(e) => handleUpdateCustomDate(index, 'month', e.target.value)}
                  className="flex-1 min-w-[100px] h-9 rounded-md border border-input bg-background px-3 text-sm"
                  data-testid={`dates-custom-month-${index}`}
                >
                  <option value="">Month</option>
                  {MONTHS.map((month, idx) => (
                    <option key={month} value={(idx + 1).toString().padStart(2, '0')}>
                      {month}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={cd.day}
                  onChange={(e) => handleUpdateCustomDate(index, 'day', e.target.value)}
                  placeholder="Day"
                  className="w-20"
                  data-testid={`dates-custom-day-${index}`}
                />
                <Input
                  type="number"
                  min="1900"
                  max={currentYear + 10}
                  value={cd.year}
                  onChange={(e) => handleUpdateCustomDate(index, 'year', e.target.value)}
                  placeholder="Year (optional)"
                  className="w-32"
                  data-testid={`dates-custom-year-${index}`}
                />
              </div>
            </div>
          ))}

          {/* Add Custom Date */}
          <div className="flex gap-2">
            <Input
              value={newDateName}
              onChange={(e) => setNewDateName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomDate()}
              placeholder="Add new date (e.g., Graduation)"
              className="flex-1"
              data-testid="dates-new-name"
            />
            <Button
              onClick={handleAddCustomDate}
              variant="outline"
              size="sm"
              className="hover-elevate"
              disabled={!newDateName.trim()}
              data-testid="dates-add-custom"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Show on card counter */}
          <p className="text-xs text-muted-foreground text-center">
            {countShowOnCard()}/3 dates selected to show on profile card
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="hover-elevate active-elevate-2">
            Save Dates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
