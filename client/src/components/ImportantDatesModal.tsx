import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface CustomDate {
  name: string;
  month: string;
  day: string;
}

export function ImportantDatesModal({ 
  open, 
  onOpenChange, 
  profile,
  onSave,
}: ImportantDatesModalProps) {
  const [birthdayMonth, setBirthdayMonth] = useState('');
  const [birthdayDay, setBirthdayDay] = useState('');
  const [anniversaryMonth, setAnniversaryMonth] = useState('');
  const [anniversaryDay, setAnniversaryDay] = useState('');
  const [customDates, setCustomDates] = useState<CustomDate[]>([]);
  const [newDateName, setNewDateName] = useState('');

  useEffect(() => {
    if (profile && open) {
      const birthday = parseMMDD(profile.birthdayDate);
      setBirthdayMonth(birthday.month);
      setBirthdayDay(birthday.day);
      
      const anniversary = parseMMDD(profile.anniversaryDate);
      setAnniversaryMonth(anniversary.month);
      setAnniversaryDay(anniversary.day);
      
      const existingCustomDates = (profile.customDates || []).map(cd => {
        const parsed = parseMMDD(cd.date);
        return { name: cd.name, month: parsed.month, day: parsed.day };
      });
      setCustomDates(existingCustomDates);
      setNewDateName('');
    }
  }, [profile, open]);

  if (!profile) return null;

  const handleAddCustomDate = () => {
    if (!newDateName.trim()) return;
    setCustomDates([...customDates, { name: newDateName.trim(), month: '', day: '' }]);
    setNewDateName('');
  };

  const handleRemoveCustomDate = (index: number) => {
    setCustomDates(customDates.filter((_, i) => i !== index));
  };

  const handleUpdateCustomDate = (index: number, field: 'name' | 'month' | 'day', value: string) => {
    const updated = [...customDates];
    updated[index] = { ...updated[index], [field]: value };
    setCustomDates(updated);
  };

  const handleSave = () => {
    const formattedCustomDates = customDates
      .filter(cd => cd.month && cd.day)
      .map(cd => ({
        name: cd.name,
        date: formatMMDD(cd.month, cd.day)!
      }));

    onSave?.({
      birthdayDate: formatMMDD(birthdayMonth, birthdayDay),
      anniversaryDate: formatMMDD(anniversaryMonth, anniversaryDay),
      customDates: formattedCustomDates.length > 0 ? formattedCustomDates : undefined,
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
            Track special dates for {profile.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Birthday */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Birthday</Label>
            <div className="flex gap-2">
              <select
                value={birthdayMonth}
                onChange={(e) => setBirthdayMonth(e.target.value)}
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
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
              {(birthdayMonth || birthdayDay) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setBirthdayMonth(''); setBirthdayDay(''); }}
                  className="hover-elevate h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Anniversary */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Anniversary</Label>
            <div className="flex gap-2">
              <select
                value={anniversaryMonth}
                onChange={(e) => setAnniversaryMonth(e.target.value)}
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
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
              {(anniversaryMonth || anniversaryDay) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setAnniversaryMonth(''); setAnniversaryDay(''); }}
                  className="hover-elevate h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium">Custom Dates</Label>
          </div>

          {/* Custom Dates List */}
          {customDates.map((cd, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center gap-2">
                <Input
                  value={cd.name}
                  onChange={(e) => handleUpdateCustomDate(index, 'name', e.target.value)}
                  placeholder="Date name"
                  className="flex-1"
                  data-testid={`dates-custom-name-${index}`}
                />
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
              <div className="flex gap-2 ml-0">
                <select
                  value={cd.month}
                  onChange={(e) => handleUpdateCustomDate(index, 'month', e.target.value)}
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
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
