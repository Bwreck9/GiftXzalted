import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Calendar } from 'lucide-react';
import type { Profile } from '@shared/schema';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onSave?: (updates: Partial<Profile>) => void;
  onDelete?: (profileId: string) => void;
  onClear?: (profileId: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
];

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

export function SettingsModal({ 
  open, 
  onOpenChange, 
  profile,
  onSave,
  onDelete,
  onClear 
}: SettingsModalProps) {
  const [name, setName] = useState(profile?.name || '');
  const [color, setColor] = useState(profile?.color || '#3B82F6');
  const [customColor, setCustomColor] = useState('');
  
  const [birthdayMonth, setBirthdayMonth] = useState('');
  const [birthdayDay, setBirthdayDay] = useState('');
  const [anniversaryMonth, setAnniversaryMonth] = useState('');
  const [anniversaryDay, setAnniversaryDay] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setColor(profile.color || '#3B82F6');
      setCustomColor('');
      
      const birthday = parseMMDD(profile.birthdayDate);
      setBirthdayMonth(birthday.month);
      setBirthdayDay(birthday.day);
      
      const anniversary = parseMMDD(profile.anniversaryDate);
      setAnniversaryMonth(anniversary.month);
      setAnniversaryDay(anniversary.day);
    }
  }, [profile, open]);

  if (!profile) return null;

  const handleSave = () => {
    onSave?.({
      name: name || profile.name,
      color: customColor || color,
      birthdayDate: formatMMDD(birthdayMonth, birthdayDay),
      anniversaryDate: formatMMDD(anniversaryMonth, anniversaryDay),
    });
    onOpenChange(false);
  };

  const handleClear = () => {
    if (confirm(`Clear all data for "${profile.name}"? This will remove all manual ideas and premium results.`)) {
      onClear?.(profile.id);
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (confirm(`Delete profile "${profile.name}"? This action cannot be undone.`)) {
      onDelete?.(profile.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="settings-modal">
        <DialogHeader className="relative">
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 hover-elevate"
            data-testid="settings-close-top"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Manage settings for {profile.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rename */}
          <div className="space-y-2">
            <Label htmlFor="profile-name">Profile Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              data-testid="settings-name-input"
            />
          </div>

          {/* Color Presets */}
          <div className="space-y-2">
            <Label>Profile Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setColor(preset.value);
                    setCustomColor('');
                  }}
                  className={`h-12 rounded-md border-2 transition-all ${
                    color === preset.value && !customColor
                      ? 'border-primary scale-105'
                      : 'border-transparent hover:border-muted-foreground'
                  }`}
                  style={{ backgroundColor: preset.value }}
                  aria-label={preset.name}
                  data-testid={`color-preset-${preset.name.toLowerCase()}`}
                />
              ))}
            </div>
          </div>

          {/* Custom Color */}
          <div className="space-y-2">
            <Label htmlFor="custom-color">Custom Color</Label>
            <div className="flex gap-2">
              <Input
                id="custom-color"
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="#RRGGBB"
                data-testid="settings-custom-color-input"
              />
              <Input
                type="color"
                value={customColor || color}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-16"
                data-testid="settings-color-picker"
              />
            </div>
          </div>

          {/* Important Dates */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <Label className="text-base font-semibold">Important Dates</Label>
            </div>
            
            {/* Birthday */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Birthday</Label>
              <div className="flex gap-2">
                <select
                  value={birthdayMonth}
                  onChange={(e) => setBirthdayMonth(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                  data-testid="settings-birthday-month"
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
                  data-testid="settings-birthday-day"
                />
              </div>
            </div>

            {/* Anniversary */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Anniversary</Label>
              <div className="flex gap-2">
                <select
                  value={anniversaryMonth}
                  onChange={(e) => setAnniversaryMonth(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                  data-testid="settings-anniversary-month"
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
                  data-testid="settings-anniversary-day"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              className="w-full hover-elevate active-elevate-2"
              data-testid="settings-save"
            >
              Save Changes
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="w-full hover-elevate active-elevate-2"
              data-testid="settings-clear"
            >
              Clear Profile Data
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="w-full hover-elevate active-elevate-2"
              data-testid="settings-delete"
            >
              Delete Profile
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-full border-2 border-foreground/20 font-semibold hover-elevate active-elevate-2"
              data-testid="settings-close-bottom"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
