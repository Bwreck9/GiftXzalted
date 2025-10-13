import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface NewProfileCardProps {
  onClick: () => void;
}

export function NewProfileCard({ onClick }: NewProfileCardProps) {
  return (
    <Card
      onClick={onClick}
      data-testid="button-new-profile"
      className="p-6 cursor-pointer transition-all border-2 border-dashed border-border hover:border-primary hover:bg-accent/50 hover-elevate active-elevate-2 flex items-center justify-center min-h-[180px]"
    >
      <div className="flex flex-col items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
        <div className="rounded-full bg-primary/10 p-4">
          <Plus className="h-8 w-8 text-primary" />
        </div>
        <span className="text-base font-medium">New Profile</span>
      </div>
    </Card>
  );
}
