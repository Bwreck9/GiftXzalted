/**
 * ProfileDetail - Unified gift profile page
 * Shows all gift ideas for a person directly (no separate gift lists layer)
 * Ideas can have occasion tags (Birthday, Christmas, etc.)
 * Includes Train Profile functionality and AI generation
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Plus, Brain, Settings, Trash2, ArrowLeft, Pencil, Sparkles, 
  Loader2, X, Info, Calendar, ChevronDown, Check, Gift
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import type { Profile, GiftList } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { QuestionnaireDialog } from '@/components/QuestionnaireDialog';
import { SettingsModal } from '@/components/SettingsModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TOKENS_PER_10_IDEAS = 200;

const OCCASION_OPTIONS = [
  'Birthday',
  'Christmas',
  'Anniversary',
  "Mother's Day",
  "Father's Day",
  "Valentine's Day",
  'Graduation',
  'Wedding',
  'Baby Shower',
  'Housewarming',
  'Thank You',
  'Just Because',
];

interface UnifiedIdea {
  id: string;
  title: string;
  occasion: string;
  reason?: string;
  isAiGenerated?: boolean;
  giftListId: string;
}

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addIdeaDialogOpen, setAddIdeaDialogOpen] = useState(false);
  const [needTokensDialogOpen, setNeedTokensDialogOpen] = useState(false);
  const [questionnaireDialogOpen, setQuestionnaireDialogOpen] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaOccasion, setNewIdeaOccasion] = useState('');
  const [customOccasion, setCustomOccasion] = useState('');
  const [filterOccasion, setFilterOccasion] = useState('all');
  const [numIdeas, setNumIdeas] = useState(10);
  const [sessionGeneratedIdeas, setSessionGeneratedIdeas] = useState<string[]>([]);
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PATCH', `/api/profiles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}`] });
      toast({ title: 'Profile updated successfully' });
      setQuestionnaireOpen(false);
    },
    onError: () => {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    },
  });

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: [`/api/profiles/${id}`],
  });

  const { data: giftLists, isLoading: listsLoading } = useQuery<GiftList[]>({
    queryKey: [`/api/profiles/${id}/gift-lists`],
    enabled: !!id,
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      return apiRequest('DELETE', `/api/profiles/${profileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({ title: 'Profile deleted successfully' });
      setLocation('/');
    },
    onError: () => {
      toast({ title: 'Failed to delete profile', variant: 'destructive' });
    },
  });

  const clearProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      return apiRequest('POST', `/api/profiles/${profileId}/clear`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
      toast({ title: 'Profile data cleared successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to clear profile data', variant: 'destructive' });
    },
  });

  const createListMutation = useMutation({
    mutationFn: async (data: { title: string }) => {
      return apiRequest('POST', `/api/profiles/${id}/gift-lists`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
    },
  });

  const addIdeaMutation = useMutation({
    mutationFn: async ({ giftListId, ideas }: { giftListId: string; ideas: string[] }) => {
      return apiRequest('PATCH', `/api/gift-lists/${giftListId}`, { manualIdeas: ideas });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
      toast({ title: 'Idea added!' });
      setAddIdeaDialogOpen(false);
      setNewIdeaTitle('');
      setNewIdeaOccasion('');
      setCustomOccasion('');
    },
    onError: () => {
      toast({ title: 'Failed to add idea', variant: 'destructive' });
    },
  });

  const removeIdeaMutation = useMutation({
    mutationFn: async ({ giftListId, ideas }: { giftListId: string; ideas: string[] }) => {
      return apiRequest('PATCH', `/api/gift-lists/${giftListId}`, { manualIdeas: ideas });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
      toast({ title: 'Idea removed' });
    },
    onError: () => {
      toast({ title: 'Failed to remove idea', variant: 'destructive' });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (giftListId: string) => {
      const tokenCost = (numIdeas / 10) * TOKENS_PER_10_IDEAS;
      
      if (user) {
        queryClient.setQueryData(['/api/auth/user'], (oldData: any) => {
          if (!oldData) return oldData;
          const totalTokens = (oldData.tokens ?? 0) + (oldData.purchasedTokens ?? 0);
          if (totalTokens < tokenCost) return oldData;
          
          const newPurchasedTokens = Math.max(0, (oldData.purchasedTokens ?? 0) - tokenCost);
          const remainingToDeduct = tokenCost - ((oldData.purchasedTokens ?? 0) - newPurchasedTokens);
          const newTokens = remainingToDeduct > 0 ? Math.max(0, (oldData.tokens ?? 0) - remainingToDeduct) : oldData.tokens;
          
          return {
            ...oldData,
            tokens: newTokens,
            purchasedTokens: newPurchasedTokens,
          };
        });
      }

      const res = await apiRequest('POST', '/api/messages', {
        profileId: id,
        giftListId,
        content: 'Generate gift recommendations',
        isUser: true,
        alreadyGeneratedIdeas: sessionGeneratedIdeas,
        numIdeas,
      });
      return await res.json();
    },
    onSuccess: async (data: any) => {
      if (data?.aiResponse) {
        try {
          let cleanedResponse = data.aiResponse.trim();
          if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```(?:json|JSON)?\s*/i, '').replace(/\s*```$/i, '');
          }
          const newIdeas = JSON.parse(cleanedResponse);
          if (Array.isArray(newIdeas)) {
            const newTitles = newIdeas.map((idea: any) => idea.title);
            setSessionGeneratedIdeas(prev => [...prev, ...newTitles]);
          }
        } catch (e) {
          console.error('Failed to parse AI response for session tracking:', e);
        }
      }
      await queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: 'Gift ideas generated!' });
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      if (error.message?.includes('402') || error.message?.includes('Insufficient tokens')) {
        toast({ title: 'Not enough tokens', description: 'Purchase more tokens to generate ideas', variant: 'destructive' });
      } else {
        toast({ title: 'Failed to generate ideas', variant: 'destructive' });
      }
    },
  });

  const unifiedIdeas: UnifiedIdea[] = (giftLists || []).flatMap(list => {
    const manualIdeas = (list.manualIdeas || []).map((title, idx) => ({
      id: `${list.id}-manual-${idx}`,
      title,
      occasion: list.title,
      isAiGenerated: false,
      giftListId: list.id,
    }));

    let aiIdeas: UnifiedIdea[] = [];
    if (list.premiumResults) {
      try {
        const parsed = JSON.parse(list.premiumResults);
        aiIdeas = (parsed || []).map((item: any, idx: number) => ({
          id: `${list.id}-ai-${idx}`,
          title: item.title,
          reason: item.reason,
          occasion: list.title,
          isAiGenerated: true,
          giftListId: list.id,
        }));
      } catch (e) {
        console.error('Failed to parse premiumResults:', e);
      }
    }

    return [...manualIdeas, ...aiIdeas];
  });

  const filteredIdeas = filterOccasion === 'all' 
    ? unifiedIdeas 
    : unifiedIdeas.filter(idea => idea.occasion === filterOccasion);

  const savedIdeas = filteredIdeas.filter(idea => !idea.isAiGenerated);
  const generatedIdeas = filteredIdeas.filter(idea => idea.isAiGenerated);

  const occasionsList = Array.from(new Set((giftLists || []).map(list => list.title)));

  const handleAddIdea = async () => {
    if (!newIdeaTitle.trim()) {
      toast({ title: 'Please enter an idea', variant: 'destructive' });
      return;
    }

    const occasion = newIdeaOccasion === 'custom' ? customOccasion.trim() : newIdeaOccasion;
    if (!occasion) {
      toast({ title: 'Please select or enter an occasion', variant: 'destructive' });
      return;
    }

    let targetList = (giftLists || []).find(list => list.title === occasion);
    
    if (!targetList) {
      const response = await createListMutation.mutateAsync({ title: occasion });
      const newList = await response.json();
      targetList = newList;
    }

    if (targetList) {
      const currentIdeas = targetList.manualIdeas || [];
      addIdeaMutation.mutate({ 
        giftListId: targetList.id, 
        ideas: [...currentIdeas, newIdeaTitle.trim()] 
      });
    }
  };

  const handleRemoveIdea = (idea: UnifiedIdea) => {
    const list = (giftLists || []).find(l => l.id === idea.giftListId);
    if (!list) return;

    if (idea.isAiGenerated) {
      try {
        const currentResults = list.premiumResults ? JSON.parse(list.premiumResults) : [];
        const updatedResults = currentResults.filter((r: any) => r.title !== idea.title);
        apiRequest('PATCH', `/api/gift-lists/${list.id}`, { 
          premiumResults: JSON.stringify(updatedResults) 
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
          toast({ title: 'Idea removed' });
        });
      } catch (e) {
        console.error('Failed to remove AI idea:', e);
      }
    } else {
      const currentIdeas = list.manualIdeas || [];
      const updatedIdeas = currentIdeas.filter(i => i !== idea.title);
      removeIdeaMutation.mutate({ giftListId: list.id, ideas: updatedIdeas });
    }
  };

  const handleAddAiIdeaToSaved = (idea: UnifiedIdea) => {
    const list = (giftLists || []).find(l => l.id === idea.giftListId);
    if (!list) return;

    const currentIdeas = list.manualIdeas || [];
    if (currentIdeas.length >= 100) {
      toast({ 
        title: 'Limit reached', 
        description: 'You can have up to 100 ideas per occasion',
        variant: 'destructive' 
      });
      return;
    }

    addIdeaMutation.mutate({ 
      giftListId: list.id, 
      ideas: [...currentIdeas, idea.title] 
    });

    try {
      const currentResults = list.premiumResults ? JSON.parse(list.premiumResults) : [];
      const updatedResults = currentResults.filter((r: any) => r.title !== idea.title);
      apiRequest('PATCH', `/api/gift-lists/${list.id}`, { 
        premiumResults: JSON.stringify(updatedResults) 
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
      });
    } catch (e) {
      console.error('Failed to remove from AI ideas:', e);
    }
  };

  const handleGenerate = async () => {
    const hasQuestionnaireData = 
      profile?.ageRange ||
      profile?.gender ||
      (profile?.personalityTraits && profile.personalityTraits.length > 0) ||
      profile?.interests ||
      profile?.relationship ||
      profile?.closeness ||
      profile?.budget ||
      (profile?.giftPreferences && profile.giftPreferences.length > 0) ||
      profile?.dislikes ||
      profile?.giftStyle ||
      profile?.location ||
      profile?.additionalNotes;
    
    if (!hasQuestionnaireData) {
      setQuestionnaireDialogOpen(true);
      return;
    }

    const tokenCost = (numIdeas / 10) * TOKENS_PER_10_IDEAS;
    const totalTokens = (user?.tokens ?? 0) + (user?.purchasedTokens ?? 0);
    if (!user || totalTokens < tokenCost) {
      setNeedTokensDialogOpen(true);
      return;
    }

    let targetListId: string;
    const existingGeneralList = (giftLists || []).find(l => l.title === 'General');
    
    if (existingGeneralList) {
      targetListId = existingGeneralList.id;
    } else {
      try {
        const response = await createListMutation.mutateAsync({ title: 'General' });
        const newList = await response.json();
        targetListId = newList.id;
      } catch (error) {
        toast({ title: 'Failed to create gift list', variant: 'destructive' });
        return;
      }
    }
    
    generateMutation.mutate(targetListId);
  };

  if (profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <QuestionnaireDialog
        open={questionnaireOpen}
        onOpenChange={setQuestionnaireOpen}
        onSubmit={(data) => updateProfileMutation.mutate(data)}
        isSubmitting={updateProfileMutation.isPending}
        existingProfile={profile}
      />

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        profile={profile}
        onSave={(updates) => updateProfileMutation.mutate(updates)}
        onDelete={(profileId) => deleteProfileMutation.mutate(profileId)}
        onClear={(profileId) => clearProfileMutation.mutate(profileId)}
      />

      <AppHeader />
      
      {/* Profile Info Bar */}
      <div className="border-b bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setLocation('/')}
                variant="ghost"
                size="icon"
                className="hover-elevate shrink-0"
                data-testid="button-back-to-profiles"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-lg shadow-md shrink-0"
                style={{ backgroundColor: profile.color || '#3B82F6' }}
              />
              <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">
                {profile.name}
              </h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover-elevate shrink-0"
                    data-testid="profile-settings-menu"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setQuestionnaireOpen(true)}>
                    <Brain className="h-4 w-4 mr-2" />
                    Train Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename / Recolor
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => {
                      if (confirm(`Delete profile "${profile.name}"?`)) {
                        deleteProfileMutation.mutate(profile.id);
                      }
                    }}
                    data-testid="button-delete-profile"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button
              onClick={() => setQuestionnaireOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white border-0 hover-elevate active-elevate-2"
              data-testid="button-train-agent"
            >
              <Brain className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Train Profile</span>
              <span className="sm:hidden">Train</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2 ml-12 md:ml-16">
            Answer a few questions to get personalized gift ideas
          </p>
        </div>
      </div>

      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Important Dates Section */}
          {(profile.birthdayDate || profile.anniversaryDate) && (
            <div className="flex items-center gap-4 flex-wrap p-3 rounded-lg bg-muted/30 border">
              {profile.birthdayDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Birthday:</span>
                  <span className="font-medium">
                    {(() => {
                      const [month, day] = profile.birthdayDate.split('-');
                      const date = new Date(2000, parseInt(month) - 1, parseInt(day));
                      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                    })()}
                  </span>
                </div>
              )}
              {profile.anniversaryDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-pink-500" />
                  <span className="text-muted-foreground">Anniversary:</span>
                  <span className="font-medium">
                    {(() => {
                      const [month, day] = profile.anniversaryDate.split('-');
                      const date = new Date(2000, parseInt(month) - 1, parseInt(day));
                      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                    })()}
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className="hover-elevate ml-auto"
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          )}

          {/* Actions Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filterOccasion} onValueChange={setFilterOccasion}>
                <SelectTrigger className="w-36" data-testid="select-filter-occasion">
                  <SelectValue placeholder="All occasions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All occasions</SelectItem>
                  {occasionsList.map(occasion => (
                    <SelectItem key={occasion} value={occasion}>{occasion}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => setAddIdeaDialogOpen(true)}
                variant="outline"
                className="hover-elevate"
                data-testid="button-add-idea"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Idea
              </Button>
              <Select
                value={numIdeas.toString()}
                onValueChange={(value) => setNumIdeas(parseInt(value))}
              >
                <SelectTrigger className="w-24" data-testid="select-num-ideas">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 ideas</SelectItem>
                  <SelectItem value="20">20 ideas</SelectItem>
                  <SelectItem value="30">30 ideas</SelectItem>
                  <SelectItem value="40">40 ideas</SelectItem>
                  <SelectItem value="50">50 ideas</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white border-0 hover-elevate active-elevate-2 ${
                  !user || ((user.tokens ?? 0) + (user.purchasedTokens ?? 0)) < (numIdeas / 10) * TOKENS_PER_10_IDEAS ? 'opacity-60' : ''
                }`}
                data-testid="button-generate-ideas"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Generate ({(numIdeas / 10) * TOKENS_PER_10_IDEAS} tokens)</span>
                    <span className="sm:hidden">Generate</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Saved Ideas Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Saved Ideas ({savedIdeas.length})
            </h2>
            {listsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-card animate-pulse rounded-lg" />
                ))}
              </div>
            ) : savedIdeas.length > 0 ? (
              <div className="space-y-2">
                {savedIdeas.map(idea => (
                  <Card key={idea.id} className="p-3 md:p-4" data-testid={`saved-idea-${idea.id}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium text-foreground truncate">{idea.title}</span>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {idea.occasion}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => handleRemoveIdea(idea)}
                        variant="ghost"
                        size="icon"
                        className="hover-elevate shrink-0"
                        data-testid={`button-remove-idea-${idea.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 rounded-lg border bg-card/50">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No saved ideas yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add ideas manually or generate AI recommendations
                </p>
              </div>
            )}
          </div>

          {/* Generated Ideas Section */}
          {generatedIdeas.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Suggestions ({generatedIdeas.length})
              </h2>
              <div className="space-y-2">
                {generatedIdeas.map(idea => (
                  <Card key={idea.id} className="p-3 md:p-4" data-testid={`generated-idea-${idea.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{idea.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {idea.occasion}
                          </Badge>
                          {idea.reason && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full hover-elevate shrink-0"
                                >
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Why this gift?</h4>
                                  <p className="text-sm text-muted-foreground">{idea.reason}</p>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          onClick={() => handleAddAiIdeaToSaved(idea)}
                          variant="outline"
                          size="sm"
                          className="hover-elevate"
                          data-testid={`button-add-ai-idea-${idea.id}`}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          onClick={() => handleRemoveIdea(idea)}
                          variant="ghost"
                          size="icon"
                          className="hover-elevate"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-muted">
                <p className="text-sm text-muted-foreground">
                  These AI suggestions are temporary. Save your favorites to keep them permanently.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Idea Dialog */}
      <Dialog open={addIdeaDialogOpen} onOpenChange={setAddIdeaDialogOpen}>
        <DialogContent className="sm:max-w-[450px]" data-testid="dialog-add-idea">
          <DialogHeader>
            <DialogTitle>Add Gift Idea</DialogTitle>
            <DialogDescription>
              Add a new gift idea for {profile.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="idea-title">Gift Idea</Label>
              <Input
                id="idea-title"
                placeholder="e.g., Bluetooth speaker"
                value={newIdeaTitle}
                onChange={(e) => setNewIdeaTitle(e.target.value)}
                maxLength={100}
                data-testid="input-idea-title"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Occasion</Label>
              <Select value={newIdeaOccasion} onValueChange={setNewIdeaOccasion}>
                <SelectTrigger data-testid="select-idea-occasion">
                  <SelectValue placeholder="Select an occasion" />
                </SelectTrigger>
                <SelectContent>
                  {OCCASION_OPTIONS.map(occasion => (
                    <SelectItem key={occasion} value={occasion}>{occasion}</SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newIdeaOccasion === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom-occasion">Custom Occasion</Label>
                <Input
                  id="custom-occasion"
                  placeholder="e.g., Promotion"
                  value={customOccasion}
                  onChange={(e) => setCustomOccasion(e.target.value)}
                  maxLength={30}
                  data-testid="input-custom-occasion"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Quick Select</Label>
              <div className="grid grid-cols-3 gap-2">
                {OCCASION_OPTIONS.slice(0, 6).map((occasion) => (
                  <Button
                    key={occasion}
                    type="button"
                    variant={newIdeaOccasion === occasion ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewIdeaOccasion(occasion)}
                    className="hover-elevate text-xs h-8"
                    data-testid={`button-quick-${occasion.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    {occasion}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddIdea}
              disabled={addIdeaMutation.isPending || createListMutation.isPending || !newIdeaTitle.trim()}
              className="hover-elevate active-elevate-2"
              data-testid="button-add-idea-submit"
            >
              {addIdeaMutation.isPending || createListMutation.isPending ? 'Adding...' : 'Add Idea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Need Tokens Dialog */}
      <Dialog open={needTokensDialogOpen} onOpenChange={setNeedTokensDialogOpen}>
        <DialogContent data-testid="dialog-need-tokens">
          <DialogHeader>
            <DialogTitle>Need More Tokens</DialogTitle>
            <DialogDescription>
              You need {(numIdeas / 10) * TOKENS_PER_10_IDEAS} tokens to generate {numIdeas} gift ideas.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Current balance: {(user?.tokens ?? 0) + (user?.purchasedTokens ?? 0)} tokens
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNeedTokensDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setNeedTokensDialogOpen(false);
                setLocation('/pricing');
              }}
              className="hover-elevate active-elevate-2"
            >
              Get Tokens
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Questionnaire Prompt Dialog */}
      <Dialog open={questionnaireDialogOpen} onOpenChange={setQuestionnaireDialogOpen}>
        <DialogContent data-testid="dialog-questionnaire-prompt">
          <DialogHeader>
            <DialogTitle>Train Profile First</DialogTitle>
            <DialogDescription>
              To generate personalized gift ideas, please answer a few questions about {profile.name}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionnaireDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setQuestionnaireDialogOpen(false);
                setQuestionnaireOpen(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white border-0 hover-elevate active-elevate-2"
            >
              <Brain className="h-4 w-4 mr-2" />
              Train Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
