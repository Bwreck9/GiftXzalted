import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useCopyToClipboard } from '@/lib/clipboard';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { ChevronDown, ChevronRight, Copy, Sparkles, Trash2, ArrowLeft, Plus } from 'lucide-react';
import type { Profile } from '@shared/schema';

export default function ProfileDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { copy } = useCopyToClipboard();
  
  const [manualIdeasOpen, setManualIdeasOpen] = useState(true);
  const [premiumResultsOpen, setPremiumResultsOpen] = useState(true);
  const [manualIdeasText, setManualIdeasText] = useState('');
  const [newIdea, setNewIdea] = useState('');

  // Fetch profile data
  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['/api/profiles', id],
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      return apiRequest('PATCH', `/api/profiles/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
    },
  });

  // Clear profile data mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/profiles/${id}/clear`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({ title: 'Profile data cleared successfully' });
    },
    onError: () => {
      toast({ 
        title: 'Failed to clear profile',
        variant: 'destructive'
      });
    },
  });

  // Generate AI response mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/messages', {
        profileId: id,
        content: 'Generate gift recommendations for this profile',
        isUser: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', id] });
      toast({ title: 'AI recommendations generated!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to generate recommendations',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleAddIdea = () => {
    if (!newIdea.trim() || !profile) return;
    
    const updatedIdeas = [...(profile.manualIdeas || []), newIdea.trim()];
    updateMutation.mutate({ manualIdeas: updatedIdeas });
    setNewIdea('');
  };

  const handleRemoveIdea = (index: number) => {
    if (!profile) return;
    const updatedIdeas = profile.manualIdeas?.filter((_, i) => i !== index) || [];
    updateMutation.mutate({ manualIdeas: updatedIdeas });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  // Parse premium results
  const premiumResults = profile.premiumResults 
    ? (typeof profile.premiumResults === 'string' 
        ? JSON.parse(profile.premiumResults) 
        : profile.premiumResults)
    : null;

  // Color mapping for gradients
  const colorGradients: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
  };

  const gradientClass = colorGradients[profile.color || 'blue'] || colorGradients.blue;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Colored Header */}
      <header className={`bg-gradient-to-r ${gradientClass} text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="text-white hover:bg-white/20 mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-3xl font-bold mb-2" data-testid="text-profile-name">{profile.name}</h1>
          <div className="flex flex-wrap gap-2 text-sm opacity-90">
            <span data-testid="text-age">{profile.age} years old</span>
            <span>•</span>
            <span data-testid="text-gender">{profile.gender}</span>
            <span>•</span>
            <span data-testid="text-relationship">{profile.relationship}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile Info Card */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Profile Details</h2>
          <div className="grid gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Event:</span>{' '}
              <span data-testid="text-event">{profile.event}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Personality:</span>{' '}
              <span data-testid="text-personality">{profile.personality}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Interests:</span>{' '}
              <span data-testid="text-interests">{profile.interests}</span>
            </div>
          </div>
        </Card>

        {/* Manual Ideas Section */}
        <Collapsible open={manualIdeasOpen} onOpenChange={setManualIdeasOpen}>
          <Card className="mb-6">
            <CollapsibleTrigger className="w-full" data-testid="toggle-manual-ideas">
              <div className="flex items-center justify-between p-6 hover-elevate active-elevate-2">
                <h2 className="text-lg font-semibold">Manual Gift Ideas</h2>
                {manualIdeasOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-6 pb-6 space-y-4">
                {/* Add new idea */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a gift idea..."
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddIdea();
                      }
                    }}
                    className="resize-none"
                    rows={2}
                    data-testid="input-new-idea"
                  />
                  <Button
                    onClick={handleAddIdea}
                    disabled={!newIdea.trim() || updateMutation.isPending}
                    size="icon"
                    data-testid="button-add-idea"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* List of ideas */}
                {profile.manualIdeas && profile.manualIdeas.length > 0 ? (
                  <div className="space-y-2">
                    {profile.manualIdeas.map((idea, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 rounded-md bg-muted"
                        data-testid={`idea-item-${index}`}
                      >
                        <p className="flex-1 text-sm">{idea}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveIdea(index)}
                          data-testid={`button-remove-idea-${index}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No ideas yet. Add your first gift idea above!
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Premium AI Results Section */}
        <Collapsible open={premiumResultsOpen} onOpenChange={setPremiumResultsOpen}>
          <Card className="mb-6">
            <CollapsibleTrigger className="w-full" data-testid="toggle-premium-results">
              <div className="flex items-center justify-between p-6 hover-elevate active-elevate-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Premium AI Recommendations</h2>
                </div>
                {premiumResultsOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-6 pb-6 space-y-4">
                {premiumResults ? (
                  <div className="space-y-4">
                    {Array.isArray(premiumResults) ? (
                      premiumResults.map((result: any, index: number) => (
                        <Card key={index} className="p-4 bg-muted/50" data-testid={`premium-result-${index}`}>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h3 className="font-semibold">{result.title || result.name || `Gift ${index + 1}`}</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copy(JSON.stringify(result, null, 2), 'Gift idea copied!')}
                              data-testid={`button-copy-result-${index}`}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">{result.description || result.reason || JSON.stringify(result)}</p>
                        </Card>
                      ))
                    ) : (
                      <Card className="p-4 bg-muted/50">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-semibold">AI Recommendation</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copy(typeof premiumResults === 'string' ? premiumResults : JSON.stringify(premiumResults, null, 2), 'Recommendation copied!')}
                            data-testid="button-copy-result"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {typeof premiumResults === 'string' ? premiumResults : JSON.stringify(premiumResults, null, 2)}
                        </p>
                      </Card>
                    )}
                  </div>
                ) : profile.aiResponse ? (
                  // Fallback to legacy aiResponse field
                  <Card className="p-4 bg-muted/50">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-semibold">AI Recommendation</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copy(profile.aiResponse || '', 'Recommendation copied!')}
                        data-testid="button-copy-legacy"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.aiResponse}</p>
                  </Card>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      No AI recommendations yet. Generate personalized gift ideas!
                    </p>
                    <Button
                      onClick={() => generateMutation.mutate()}
                      disabled={generateMutation.isPending}
                      data-testid="button-generate-ai"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {generateMutation.isPending ? 'Generating...' : 'Generate Recommendations (500 tokens)'}
                    </Button>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Clear all manual ideas and AI recommendations? This cannot be undone.')) {
                clearMutation.mutate();
              }
            }}
            disabled={clearMutation.isPending}
            data-testid="button-clear-data"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
        </div>
      </main>
    </div>
  );
}
