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
              const manualIdeasCount = profile.manualIdeas?.length || 0;
              const hasPremiumResults = !!(profile.premiumResults || profile.aiResponse);
              const colorClass = colorClasses[profile.color || 'blue'] || colorClasses.blue;

              return (
                <Card 
                  key={profile.id} 
                  className="p-6 hover-elevate active-elevate-2 cursor-pointer transition-all"
                  onClick={() => setLocation(`/profile/${profile.id}`)}
                  data-testid={`profile-card-${profile.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1" data-testid={`profile-name-${profile.id}`}>
                        {profile.name}
                      </h3>
                      <div className="flex flex-wrap gap-1 text-sm text-muted-foreground">
                        <span>{profile.age} years</span>
                        <span>•</span>
                        <span>{profile.gender}</span>
                      </div>
                    </div>
                    <Badge className={`${colorClass} text-white`} data-testid={`profile-color-${profile.id}`}>
                      {profile.color || 'blue'}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Relationship:</span>{' '}
                      <span data-testid={`profile-relationship-${profile.id}`}>{profile.relationship}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Event:</span>{' '}
                      <span data-testid={`profile-event-${profile.id}`}>{profile.event}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <NotebookPen className="w-4 h-4" />
                      <span data-testid={`profile-ideas-count-${profile.id}`}>{manualIdeasCount}</span>
                    </div>
                    {hasPremiumResults && (
                      <div className="flex items-center gap-1 text-sm text-primary">
                        <Sparkles className="w-4 h-4" />
                        <span>AI</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/profile/${profile.id}`);
                    }}
                    data-testid={`button-view-${profile.id}`}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
