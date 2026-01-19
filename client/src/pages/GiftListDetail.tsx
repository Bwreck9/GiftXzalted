import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, X, Brain, ArrowLeft, Settings, Pencil, Trash2, Info, Loader2, Calendar } from 'lucide-react';
import type { GiftList, Profile } from '@shared/schema';
import { AppHeader } from '@/components/AppHeader';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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

export default function GiftListDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [manualIdeas, setManualIdeas] = useState<string[]>([]);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [questionnaireDialogOpen, setQuestionnaireDialogOpen] = useState(false);
  const [needTokensDialogOpen, setNeedTokensDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editDateDialogOpen, setEditDateDialogOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState('');
  const [shouldTriggerGenerate, setShouldTriggerGenerate] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('trigger') === 'generate';
  });
  const [clearGeneratedDialogOpen, setClearGeneratedDialogOpen] = useState(false);
  const [numIdeas, setNumIdeas] = useState(10);
  
  // Session-based tracking of generated ideas to prevent duplicates
  // This state resets when user navigates away (component unmounts)
  const [sessionGeneratedIdeas, setSessionGeneratedIdeas] = useState<string[]>([]);

  const { data: giftList, isLoading } = useQuery<GiftList>({
    queryKey: ['/api/gift-lists', id],
  });

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ['/api/profiles', giftList?.profileId],
    queryFn: async () => {
      const res = await fetch(`/api/profiles/${giftList?.profileId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!giftList?.profileId,
  });

  useEffect(() => {
    if (giftList?.manualIdeas && giftList.manualIdeas.length > 0) {
      setManualIdeas([...giftList.manualIdeas]);
    } else if (giftList && (!giftList.manualIdeas || giftList.manualIdeas.length === 0)) {
      setManualIdeas(['', '', '', '', '']);
    }
  }, [giftList?.id]);

  // Auto-save manual ideas with debouncing (1.5 seconds after user stops typing)
  useEffect(() => {
    if (!giftList?.id) return; // Don't save if no gift list loaded
    
    // Skip auto-save on initial load (when ideas match the database)
    const dbIdeas = giftList.manualIdeas || [];
    const currentIdeas = manualIdeas.filter(idea => idea.trim() !== '');
    
    // Compare current ideas with database ideas
    const ideasChanged = 
      currentIdeas.length !== dbIdeas.length ||
      currentIdeas.some((idea, i) => idea !== dbIdeas[i]);
    
    if (!ideasChanged) return; // No changes, skip auto-save
    
    const timeoutId = setTimeout(() => {
      updateIdeasMutation.mutate(currentIdeas);
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(timeoutId);
  }, [manualIdeas, giftList?.id, giftList?.manualIdeas]);

  const updateIdeasMutation = useMutation({
    mutationFn: async (ideas: string[]) => {
      return apiRequest('PATCH', `/api/gift-lists/${id}`, { manualIdeas: ideas });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/gift-lists', id] });
      if (giftList?.profileId) {
        await queryClient.refetchQueries({ 
          queryKey: ['/api/profiles', giftList.profileId, 'gift-lists']
        });
      }
      // Silent auto-save - no toast notification
    },
    onError: (error: any) => {
      const errorMsg = error?.message || 'Failed to save ideas';
      toast({ title: errorMsg, variant: 'destructive' });
    },
  });

  const clearGeneratedIdeasMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', `/api/gift-lists/${id}`, { premiumResults: null });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/gift-lists', id] });
      toast({ title: 'Generated ideas cleared' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to clear generated ideas', variant: 'destructive' });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Calculate token cost based on number of ideas
      const tokenCost = (numIdeas / 10) * TOKENS_PER_10_IDEAS;
      
      // Optimistically deduct tokens from the user's token count
      if (user) {
        queryClient.setQueryData(['/api/auth/user'], (oldData: any) => {
          if (!oldData) return oldData;
          const totalTokens = (oldData.tokens ?? 0) + (oldData.purchasedTokens ?? 0);
          if (totalTokens < tokenCost) return oldData;
          
          // Deduct from purchased tokens first, then subscription tokens
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
        profileId: giftList?.profileId,
        giftListId: id,
        content: 'Generate gift recommendations',
        isUser: true,
        alreadyGeneratedIdeas: sessionGeneratedIdeas || [],
        numIdeas,
      });
      return await res.json();
    },
    onSuccess: async (data: any) => {
      // Update session state with newly generated ideas to prevent duplicates
      if (data?.aiResponse) {
        try {
          // Parse the AI response to extract the new idea titles
          let responseText = data.aiResponse.trim();
          
          // Remove code fences case-insensitively (```json, ```JSON, ```)
          if (responseText.startsWith('```')) {
            responseText = responseText.replace(/^```(?:json|JSON)?\n?/i, '').replace(/\n?```$/i, '');
          }
          
          const newIdeas = JSON.parse(responseText);
          
          // Extract titles and normalize (trim, lowercase) to prevent duplicates from case/punctuation variants
          const newTitles = newIdeas.map((idea: any) => idea.title.trim().toLowerCase());
          
          // Use Set to deduplicate within this batch and with previous batches
          setSessionGeneratedIdeas(prev => {
            const allIdeas = [...prev.map(t => t.toLowerCase()), ...newTitles];
            return Array.from(new Set(allIdeas));
          });
        } catch (error) {
          console.error('Failed to parse AI response for session tracking:', error);
        }
      }
      
      // Invalidate to mark as stale and force fresh fetch on next access
      await queryClient.invalidateQueries({ queryKey: ['/api/gift-lists', id] });
      if (giftList?.profileId) {
        await queryClient.invalidateQueries({ queryKey: ['/api/profiles', giftList.profileId, 'gift-lists'] });
      }
      toast({ title: 'Premium recommendations generated!' });
    },
    onError: (error: any) => {
      // Revert optimistic update on error
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
      
      const errorMessage = error.message || 'Please try again';
      if (errorMessage.includes('Insufficient tokens')) {
        toast({
          title: 'Insufficient tokens',
          description: 'Purchase more tokens to generate premium recommendations',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('questionnaire')) {
        // Show persistent dialog with link to questionnaire
        setQuestionnaireDialogOpen(true);
      } else {
        toast({
          title: 'Failed to generate recommendations',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  const renameListMutation = useMutation({
    mutationFn: async (title: string) => {
      return apiRequest('PATCH', `/api/gift-lists/${id}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gift-lists', id] });
      if (giftList?.profileId) {
        queryClient.invalidateQueries({ queryKey: ['/api/profiles', giftList.profileId, 'gift-lists'] });
      }
      toast({ title: 'List renamed successfully' });
      setRenameDialogOpen(false);
      setNewListName('');
    },
    onError: () => {
      toast({ title: 'Failed to rename list', variant: 'destructive' });
    },
  });

  const updateDateMutation = useMutation({
    mutationFn: async (eventDate: string | null) => {
      return apiRequest('PATCH', `/api/gift-lists/${id}`, { eventDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gift-lists', id] });
      if (giftList?.profileId) {
        queryClient.invalidateQueries({ queryKey: ['/api/profiles', giftList.profileId, 'gift-lists'] });
      }
      toast({ title: 'Event date updated successfully' });
      setEditDateDialogOpen(false);
      setNewEventDate('');
    },
    onError: () => {
      toast({ title: 'Failed to update event date', variant: 'destructive' });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/gift-lists/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'List deleted successfully' });
      if (giftList?.profileId) {
        setLocation(`/profile/${giftList.profileId}`);
      } else {
        setLocation('/');
      }
    },
    onError: () => {
      toast({ title: 'Failed to delete list', variant: 'destructive' });
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
    // Wait for profile to load before checking questionnaire completion
    if (profileLoading) {
      toast({
        title: 'Loading profile...',
        description: 'Please wait while we load the profile data',
      });
      return;
    }

    // Check if profile has at least ONE questionnaire field filled (one-question minimum)
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
    generateMutation.mutate();
  };

  // Auto-trigger generation if coming back from questionnaire with trigger=generate
  useEffect(() => {
    if (shouldTriggerGenerate && profile && !profileLoading && giftList && !generateMutation.isPending) {
      // Clear the trigger flag immediately to prevent loops
      setShouldTriggerGenerate(false);
      // Clear the trigger parameter from URL
      window.history.replaceState({}, '', `/gift-list/${id}`);
      // Trigger generation
      handleGenerate();
    }
  }, [shouldTriggerGenerate, profile, profileLoading, giftList, generateMutation.isPending]);

  const handleRenameList = () => {
    if (!newListName.trim()) {
      toast({ title: 'Please enter a name', variant: 'destructive' });
      return;
    }
    renameListMutation.mutate(newListName.trim());
  };

  const handleDeleteList = () => {
    if (confirm(`Delete list "${giftList?.title}"?`)) {
      deleteListMutation.mutate();
    }
  };

  const removeGeneratedIdeaMutation = useMutation({
    mutationFn: async (titleToRemove: string) => {
      if (!giftList?.premiumResults) return;
      const currentResults = JSON.parse(giftList.premiumResults);
      const updatedResults = currentResults.filter((r: any) => r.title !== titleToRemove);
      return apiRequest('PATCH', `/api/gift-lists/${id}`, { 
        premiumResults: JSON.stringify(updatedResults) 
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/gift-lists', id] });
    },
  });

  const handleAddToList = (title: string) => {
    const currentIdeas = manualIdeas.filter(idea => idea.trim() !== '');
    
    // Check if adding this idea would exceed the limit
    if (currentIdeas.length >= 100) {
      toast({ 
        title: 'Gift idea limit reached', 
        description: 'You can have up to 100 ideas per list. Delete some ideas to add new ones.',
        variant: 'destructive' 
      });
      return;
    }
    
    const newIdeas = [...manualIdeas, title];
    setManualIdeas(newIdeas);
    updateIdeasMutation.mutate(newIdeas.filter(idea => idea.trim() !== ''));
    
    // Remove from generated ideas
    removeGeneratedIdeaMutation.mutate(title);
    toast({ title: 'Added to your list!' });
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
      <AppHeader />
      
      {/* Profile Info Bar */}
      {profile && (
        <div className="border-b bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg shadow-md"
                style={{ backgroundColor: profile.color || '#3B82F6' }}
              />
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {profile.name}
                </h1>
              </div>
            </div>
            <Button
              onClick={() => setLocation(`/profile/${giftList.profileId}`)}
              variant="outline"
              className="hover-elevate active-elevate-2"
              data-testid="button-back-to-lists"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to lists
            </Button>
          </div>
        </div>
      )}

      {/* Gift List Actions Bar */}
      <div className="border-b px-6 py-3 bg-card">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{giftList.title}</h2>
            {giftList.eventDate && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1" data-testid="text-event-date">
                <Calendar className="h-3 w-3" />
                {new Date(giftList.eventDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate ({(numIdeas / 10) * TOKENS_PER_10_IDEAS} tokens)
                </>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="hover-elevate"
                  data-testid="button-list-options"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setNewListName(giftList?.title || '');
                    setRenameDialogOpen(true);
                  }}
                  data-testid="menu-item-rename"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename list
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const currentDate = giftList?.eventDate 
                      ? new Date(giftList.eventDate).toISOString().split('T')[0]
                      : '';
                    setNewEventDate(currentDate);
                    setEditDateDialogOpen(true);
                  }}
                  data-testid="menu-item-edit-date"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Edit date
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDeleteList}
                  data-testid="menu-item-delete"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete list
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Gift Ideas</h2>
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Generated Ideas</h2>
              {premiumResults && premiumResults.length > 0 && (
                <Button
                  onClick={() => setClearGeneratedDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="hover-elevate text-destructive hover:text-destructive"
                  data-testid="button-clear-generated"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear all
                </Button>
              )}
            </div>
            {premiumResults && premiumResults.length > 0 ? (
              <div className="space-y-3">
                {premiumResults.map((result: any, index: number) => (
                  <div
                    key={result.id || index}
                    className="p-4 rounded-lg border bg-card"
                    data-testid={`premium-result-${index}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{result.title}</h3>
                          {result.reason && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full hover-elevate shrink-0"
                                  data-testid={`button-info-${index}`}
                                >
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" data-testid={`popover-reason-${index}`}>
                                <div className="space-y-2">
                                  <h4 className="font-medium">Why this gift?</h4>
                                  <p className="text-sm text-muted-foreground">{result.reason}</p>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAddToList(result.title)}
                        variant="outline"
                        size="sm"
                        className="hover-elevate shrink-0"
                        data-testid={`button-add-to-list-${index}`}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to list
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-muted" data-testid="disclaimer-temporary-ideas">
                  <p className="text-sm text-muted-foreground">
                    Note: These AI suggestions are temporary. Add your favorites to the manual list above to save them permanently.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Future enhancement: We're working on adding the ability to search trusted retailers directly for these gift ideas!
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 rounded-lg border bg-card/50">
                <p className="text-muted-foreground">No generations yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Generate ideas" to get AI-powered gift recommendations
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent data-testid="dialog-rename-list">
          <DialogHeader>
            <DialogTitle>Rename List</DialogTitle>
            <DialogDescription>
              Enter a new name for this gift list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-list-name">List Name</Label>
              <Input
                id="new-list-name"
                placeholder="e.g., Birthday"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                maxLength={20}
                data-testid="input-new-list-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleRenameList}
              disabled={renameListMutation.isPending}
              className="hover-elevate active-elevate-2"
              data-testid="button-rename-list-submit"
            >
              {renameListMutation.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDateDialogOpen} onOpenChange={setEditDateDialogOpen}>
        <DialogContent data-testid="dialog-edit-date">
          <DialogHeader>
            <DialogTitle>Edit Event Date</DialogTitle>
            <DialogDescription>
              Set the date for this occasion
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-date">Event Date</Label>
              <Input
                id="event-date"
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                data-testid="input-event-date"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {(giftList.eventDate || newEventDate) && (
              <Button
                onClick={() => {
                  updateDateMutation.mutate(null);
                  setNewEventDate('');
                }}
                variant="outline"
                disabled={updateDateMutation.isPending}
                data-testid="button-clear-date"
              >
                Clear Date
              </Button>
            )}
            <Button
              onClick={() => updateDateMutation.mutate(newEventDate || null)}
              disabled={updateDateMutation.isPending}
              className="hover-elevate active-elevate-2"
              data-testid="button-save-date"
            >
              {updateDateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={questionnaireDialogOpen} onOpenChange={setQuestionnaireDialogOpen}>
        <DialogContent data-testid="dialog-questionnaire-required">
          <DialogHeader>
            <DialogTitle>Complete Questionnaire First</DialogTitle>
            <DialogDescription>
              To generate AI-powered gift recommendations, you need to complete the profile questionnaire first. This helps the AI understand the recipient's preferences and personality.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setQuestionnaireDialogOpen(false)}
              data-testid="button-cancel-questionnaire"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setQuestionnaireDialogOpen(false);
                setLocation(`/questionnaire?profile=${giftList?.profileId}&from=giftlist&listId=${id}`);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white border-0 hover-elevate active-elevate-2"
              data-testid="button-go-to-questionnaire"
            >
              Complete Questionnaire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={needTokensDialogOpen} onOpenChange={setNeedTokensDialogOpen}>
        <DialogContent data-testid="dialog-tokens-required">
          <DialogHeader>
            <DialogTitle>Tokens Required</DialogTitle>
            <DialogDescription>
              You need at least 200 tokens to generate AI-powered gift recommendations. Each generation costs 200 tokens and creates 10 personalized gift ideas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setNeedTokensDialogOpen(false)}
              data-testid="button-cancel-tokens"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setNeedTokensDialogOpen(false);
                setLocation('/pricing');
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white border-0 hover-elevate active-elevate-2"
              data-testid="button-go-to-pricing"
            >
              View Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clearGeneratedDialogOpen} onOpenChange={setClearGeneratedDialogOpen}>
        <DialogContent data-testid="dialog-clear-generated">
          <DialogHeader>
            <DialogTitle>Clear Generated Ideas?</DialogTitle>
            <DialogDescription>
              This will remove all AI-generated gift ideas for this list. Your manual gift ideas will not be affected. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setClearGeneratedDialogOpen(false)}
              data-testid="button-cancel-clear-generated"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setClearGeneratedDialogOpen(false);
                clearGeneratedIdeasMutation.mutate();
              }}
              variant="destructive"
              disabled={clearGeneratedIdeasMutation.isPending}
              className="hover-elevate active-elevate-2"
              data-testid="button-confirm-clear-generated"
            >
              {clearGeneratedIdeasMutation.isPending ? 'Clearing...' : 'Clear All Ideas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
