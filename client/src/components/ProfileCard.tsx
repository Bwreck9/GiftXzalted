import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Profile } from '@shared/schema';
import { Gift, Calendar } from 'lucide-react';

interface ProfileCardProps {
  profile: Profile;
  onClick: () => void;
}

export function ProfileCard({ profile, onClick }: ProfileCardProps) {
  const initials = profile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getAgeRange = (age: number) => {
    if (age < 5) return 'Baby/Toddler';
    if (age < 13) return 'Child';
    if (age < 20) return 'Teen';
    if (age < 30) return 'Young Adult';
    if (age < 50) return 'Adult';
    if (age < 65) return 'Middle Age';
    return 'Senior';
  };

  return (
    <Card
      onClick={onClick}
      data-testid={`card-profile-${profile.id}`}
      className="p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover-elevate active-elevate-2"
    >
      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="text-center w-full">
          <h3 className="text-xl font-semibold text-foreground mb-1" data-testid={`text-profile-name-${profile.id}`}>
            {profile.name}
          </h3>
          
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Gift className="h-4 w-4" />
              <span>{profile.event}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{getAgeRange(profile.age)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
