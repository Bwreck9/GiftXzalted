import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Sparkles, Plus, X } from 'lucide-react';
import type { GiftList } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function GiftListDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [manualIdeas, setManualIdeas] = useState<string[]>([]);

  const { data: giftList, isLoading } = useQuery<GiftList>({
    queryKey: ['/api/gift-lists', id],
  });

  useEffect(() => {
    if (giftList?.manualIdeas && giftList.manualIdeas.length > 0) {
      setManualIdeas([...giftList.manualIdeas]);
    } else if (giftList && (!giftList.manualIdeas || giftList.manualIdeas.length === 0)) {
      setManualIdeas(['', '', '', '', '']);
    }
  }, [giftList?.id]);

  const updateIdeasMutation = useMutation({
    mutationFn: async (ideas: string[]) => {
      return apiRequest('PATCH', `/api/gift-lists/${id}`, { manualIdeas: ideas });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gift-lists', id] });
      toast({ title: 'Ideas saved successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to save ideas', variant: 'destructive' });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/messages', {
        profileId: giftList?.profileId,
        content: 'Generate gift recommendations',
        isUser: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gift-lists', id] });
      toast({ title: 'Premium recommendations generated!' });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Please try again';
      if (errorMessage.includes('Insufficient tokens')) {
        toast({
          title: 'Insufficient tokens',
          description: 'Purchase more tokens to generate premium recommendations',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('questionnaire')) {
        toast({
          title: 'Complete questionnaire first',
          description: 'Train the agent by completing the profile questionnaire',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to generate recommendations',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  const handleUpdateIdea = (index: number, value: string) => {
    const newIdeas = [...manualIdeas];
    newIdeas[index] = value;
    setManualIdeas(newIdeas);
  };

  const handleAddIdea = () => {
    setManualIdeas([...manualIdeas, '']);
  };

  const handleRemoveIdea = (index: number) => {
    const newIdeas = manualIdeas.filter((_, i) => i !== index);
    setManualIdeas(newIdeas);
  };

  const handleSave = () => {
    updateIdeasMutation.mutate(manualIdeas.filter(idea => idea.trim() !== ''));
  };

  const handleGenerate = () => {
    if (!user || user.tokens < 500) {
      toast({
        title: 'Insufficient tokens',
        description: 'You need at least 500 tokens to generate recommendations',
        variant: 'destructive',
      });
      setLocation('/pricing');
      return;
    }
    generateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!giftList) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Gift list not found</div>
      </div>
    );
  }

  const premiumResults = giftList.premiumResults ? JSON.parse(giftList.premiumResults) : [];

  return (
    <div className="h-screen flex flex-col">
      <header className="h-16 border-b flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => history.back()}
            variant="ghost"
            size="icon"
            className="hover-elevate"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{giftList.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            variant="outline"
            disabled={updateIdeasMutation.isPending}
            className="hover-elevate active-elevate-2"
            data-testid="button-save"
          >
            {updateIdeasMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !user || user.tokens < 500}
            className="hover-elevate active-elevate-2"
            data-testid="button-generate"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {generateMutation.isPending ? 'Generating...' : 'Premium Generate (500 tokens)'}
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Manual Gift Ideas</h2>
              <Button
                onClick={handleAddIdea}
                variant="outline"
                size="sm"
                className="hover-elevate"
                data-testid="button-add-idea"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Idea
              </Button>
            </div>
            <div className="space-y-3">
              {manualIdeas.map((idea, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={idea}
                    onChange={(e) => handleUpdateIdea(index, e.target.value)}
                    placeholder={`Gift idea ${index + 1}`}
                    className="flex-1"
                    data-testid={`input-idea-${index}`}
                  />
                  {manualIdeas.length > 1 && (
                    <Button
                      onClick={() => handleRemoveIdea(index)}
                      variant="ghost"
                      size="icon"
                      className="hover-elevate"
                      data-testid={`button-remove-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {premiumResults && premiumResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Premium AI Recommendations</h2>
              <div className="space-y-3">
                {premiumResults.map((result: any, index: number) => (
                  <div
                    key={result.id || index}
                    className="p-4 rounded-lg border bg-card"
                    data-testid={`premium-result-${index}`}
                  >
                    <h3 className="font-medium text-foreground mb-2">{result.title}</h3>
                    <p className="text-sm text-muted-foreground">{result.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
