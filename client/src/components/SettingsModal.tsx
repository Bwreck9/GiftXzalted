import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
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

  if (!profile) return null;

  const handleSave = () => {
    onSave?.({
      name: name || profile.name,
      color: customColor || color,
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
      <DialogContent className="sm:max-w-md" data-testid="settings-modal">
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
