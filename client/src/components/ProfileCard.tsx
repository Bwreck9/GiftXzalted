import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Profile } from '@shared/schema';

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
          <h3 className="text-xl font-semibold text-foreground" data-testid={`text-profile-name-${profile.id}`}>
            {profile.name}
          </h3>
        </div>
      </div>
    </Card>
  );
}
