import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Sparkles, NotebookPen } from 'lucide-react';
import type { Profile } from '@shared/schema';

export default function ProfilesList() {
  const [, setLocation] = useLocation();

  // Fetch all profiles
  const { data: profiles = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
  });

  // Color mapping for badges
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    pink: 'bg-pink-500 hover:bg-pink-600',
    green: 'bg-green-500 hover:bg-green-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    red: 'bg-red-500 hover:bg-red-600',
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-2xl font-bold" data-testid="heading-profiles-list">All Profiles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'} total
          </p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No profiles yet</p>
            <Button onClick={() => setLocation('/questionnaire')} data-testid="button-create-first">
              Create Your First Profile
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => {
              const colorClass = colorClasses[profile.color || 'blue'] || colorClasses.blue;

              return (
                <Card 
                  key={profile.id} 
                  className="p-6 hover-elevate active-elevate-2 cursor-pointer transition-all"
                  onClick={() => setLocation(`/profile/${profile.id}`)}
                  data-testid={`profile-card-${profile.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg" data-testid={`profile-name-${profile.id}`}>
                        {profile.name}
                      </h3>
                    </div>
                    <Badge className={`${colorClass} text-white`} data-testid={`profile-color-${profile.id}`}>
                      {profile.color || 'blue'}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
