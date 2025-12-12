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
  Loader2, X, Info, Calendar, ChevronDown, ChevronUp, Check, Gift
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

const DEFAULT_OCCASIONS = [
  'General',
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

// Color mapping for occasion badges
const OCCASION_COLORS: Record<string, string> = {
  'Birthday': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'Christmas': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Anniversary': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  "Mother's Day": 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  "Father's Day": 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  "Valentine's Day": 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Graduation': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Wedding': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Baby Shower': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  'Housewarming': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Thank You': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Just Because': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  'General': 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300',
};

const getOccasionColor = (occasion: string) => 
  OCCASION_COLORS[occasion] || 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300';

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
  const [location, setLocation] = useLocation();
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
  const [newInlineIdea, setNewInlineIdea] = useState<{ title: string; occasion: string } | null>(null);
  const [savedIdeasCollapsed, setSavedIdeasCollapsed] = useState(false);
  const [purchasedIdeas, setPurchasedIdeas] = useState<Set<string>>(new Set());
  const [flashingIdeas, setFlashingIdeas] = useState<Map<string, 'add' | 'remove'>>(new Map());
  const [editingIdea, setEditingIdea] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const newIdeaInputRef = useRef<HTMLInputElement>(null);
  
  // Handle ?train=true query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('train') === 'true') {
      setQuestionnaireDialogOpen(true);
      // Clear the query param from URL
      window.history.replaceState({}, '', `/profile/${id}`);
    }
  }, [id]);
  
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
    mutationFn: async ({ giftListId, ideas, newIdeaTitle }: { giftListId: string; ideas: string[]; newIdeaTitle?: string }) => {
      return apiRequest('PATCH', `/api/gift-lists/${giftListId}`, { manualIdeas: ideas });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
      toast({ title: 'Idea added!' });
      setAddIdeaDialogOpen(false);
      setNewIdeaTitle('');
      setNewIdeaOccasion('');
      setCustomOccasion('');
      // Trigger flash effect for the newly added idea (first item in the list)
      if (variables.newIdeaTitle) {
        const flashId = `${variables.giftListId}-manual-0`;
        triggerFlash(flashId, 'add');
      }
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

    // Flash the idea being removed
    triggerFlash(idea.id, 'remove');

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

  // Helper to trigger flash effect
  const triggerFlash = (ideaId: string, type: 'add' | 'remove') => {
    setFlashingIdeas(prev => {
      const next = new Map(prev);
      next.set(ideaId, type);
      return next;
    });
    // Clear flash after animation completes
    setTimeout(() => {
      setFlashingIdeas(prev => {
        const next = new Map(prev);
        next.delete(ideaId);
        return next;
      });
    }, 600);
  };

  const togglePurchased = (ideaId: string) => {
    setPurchasedIdeas(prev => {
      const next = new Set(prev);
      if (next.has(ideaId)) {
        next.delete(ideaId);
      } else {
        next.add(ideaId);
      }
      return next;
    });
    // TODO: Persist to backend using manualIdeasJson when implementing drag-drop
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

    // Flash the AI idea being saved
    triggerFlash(idea.id, 'add');

    addIdeaMutation.mutate({ 
      giftListId: list.id, 
      ideas: [...currentIdeas, idea.title],
      newIdeaTitle: idea.title
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

    // Use the currently selected filter occasion, or 'General' if showing all
    const targetOccasion = filterOccasion === 'all' ? 'General' : filterOccasion;
    
    let targetListId: string;
    const existingList = (giftLists || []).find(l => l.title === targetOccasion);
    
    if (existingList) {
      targetListId = existingList.id;
    } else {
      try {
        const response = await createListMutation.mutateAsync({ title: targetOccasion });
        const newList = await response.json();
        targetListId = newList.id;
      } catch (error) {
        toast({ title: 'Failed to create gift list', variant: 'destructive' });
        return;
      }
    }
    
    generateMutation.mutate(targetListId);
  };

  const handleAddInlineIdea = () => {
    // Use filtered occasion or General as default
    const defaultOccasion = filterOccasion === 'all' ? 'General' : filterOccasion;
    setNewInlineIdea({ title: '', occasion: defaultOccasion });
    setTimeout(() => newIdeaInputRef.current?.focus(), 50);
  };

  const handleSaveInlineIdea = async () => {
    if (!newInlineIdea || !newInlineIdea.title.trim()) {
      setNewInlineIdea(null);
      return;
    }

    const occasion = newInlineIdea.occasion || 'General';
    let targetList = (giftLists || []).find(list => list.title === occasion);
    
    if (!targetList) {
      const response = await createListMutation.mutateAsync({ title: occasion });
      const newList = await response.json();
      targetList = newList;
    }

    if (targetList) {
      const currentIdeas = targetList.manualIdeas || [];
      const newTitle = newInlineIdea.title.trim();
      // Prepend new idea to appear first in the list
      addIdeaMutation.mutate({ 
        giftListId: targetList.id, 
        ideas: [newTitle, ...currentIdeas],
        newIdeaTitle: newTitle
      });
    }
    setNewInlineIdea(null);
  };

  const handleUpdateIdeaTitle = async (idea: UnifiedIdea, newTitle: string) => {
    if (newTitle.trim() === idea.title) {
      setEditingIdea(null);
      return;
    }
    
    const list = (giftLists || []).find(l => l.id === idea.giftListId);
    if (!list) return;

    const currentIdeas = list.manualIdeas || [];
    const updatedIdeas = currentIdeas.map(i => i === idea.title ? newTitle.trim() : i);
    
    await apiRequest('PATCH', `/api/gift-lists/${list.id}`, { manualIdeas: updatedIdeas });
    queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
    setEditingIdea(null);
  };

  const handleChangeIdeaOccasion = async (idea: UnifiedIdea, newOccasion: string) => {
    if (newOccasion === idea.occasion) return;
    
    const oldList = (giftLists || []).find(l => l.id === idea.giftListId);
    if (!oldList) return;

    // Remove from old list
    const oldIdeas = (oldList.manualIdeas || []).filter(i => i !== idea.title);
    await apiRequest('PATCH', `/api/gift-lists/${oldList.id}`, { manualIdeas: oldIdeas });

    // Add to new list (create if needed)
    let newList = (giftLists || []).find(l => l.title === newOccasion);
    if (!newList) {
      const response = await createListMutation.mutateAsync({ title: newOccasion });
      newList = await response.json();
    }

    if (newList) {
      const newIdeas = [...(newList.manualIdeas || []), idea.title];
      await apiRequest('PATCH', `/api/gift-lists/${newList.id}`, { manualIdeas: newIdeas });
    }

    queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
  };

  const handleChangeGeneratedIdeaOccasion = async (idea: UnifiedIdea, newOccasion: string) => {
    if (newOccasion === idea.occasion) return;
    
    const oldList = (giftLists || []).find(l => l.id === idea.giftListId);
    if (!oldList) return;

    // Get current AI results and remove this idea
    let currentResults = [];
    try {
      currentResults = oldList.premiumResults ? JSON.parse(oldList.premiumResults) : [];
    } catch (e) {}
    
    const ideaData = currentResults.find((r: any) => r.title === idea.title);
    const updatedResults = currentResults.filter((r: any) => r.title !== idea.title);
    
    await apiRequest('PATCH', `/api/gift-lists/${oldList.id}`, { 
      premiumResults: JSON.stringify(updatedResults) 
    });

    // Add to new list (create if needed)
    let newList = (giftLists || []).find(l => l.title === newOccasion);
    if (!newList) {
      const response = await createListMutation.mutateAsync({ title: newOccasion });
      newList = await response.json();
    }

    if (newList && ideaData) {
      let newResults = [];
      try {
        newResults = newList.premiumResults ? JSON.parse(newList.premiumResults) : [];
      } catch (e) {}
      newResults.push(ideaData);
      await apiRequest('PATCH', `/api/gift-lists/${newList.id}`, { 
        premiumResults: JSON.stringify(newResults) 
      });
    }

    queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
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
      
      {/* Profile Info Bar - Cleaner mobile layout */}
      <div className="border-b bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 px-3 sm:px-4 md:px-6 py-3">
        <div className="max-w-4xl mx-auto">
          {/* Row 1: Back + Profile name + Gear + Customize Button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setLocation('/')}
              variant="ghost"
              size="icon"
              className="hover-elevate shrink-0 h-8 w-8"
              data-testid="button-back-to-profiles"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shadow-md shrink-0"
              style={{ backgroundColor: profile.color || '#3B82F6' }}
            />
            <h1 className="text-base sm:text-lg font-semibold text-foreground truncate min-w-0">
              {profile.name}
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover-elevate shrink-0 h-8 w-8"
                  data-testid="profile-settings-menu"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setQuestionnaireOpen(true)}>
                  <Brain className="h-4 w-4 mr-2" />
                  Customize Profile
                </DropdownMenuItem>
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
            {/* Customize Profile Button - Far right with gradient */}
            <Button
              onClick={() => setQuestionnaireOpen(true)}
              size="sm"
              className="ml-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white border-0 hover-elevate active-elevate-2"
              data-testid="button-customize-profile"
            >
              <Brain className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Customize Profile</span>
              <span className="sm:hidden">Customize</span>
            </Button>
          </div>
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

          {/* Actions Row - Mobile friendly stacked layout */}
          <div className="space-y-3">
            {/* Occasion Filter */}
            <Select value={filterOccasion} onValueChange={setFilterOccasion}>
              <SelectTrigger className="w-44" data-testid="select-filter-occasion">
                <SelectValue placeholder="All occasions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All occasions</SelectItem>
                {occasionsList.map((occasion: string) => (
                  <SelectItem key={occasion} value={occasion}>{occasion}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Row 2: Add + Generate */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleAddInlineIdea}
                variant="outline"
                size="sm"
                className="hover-elevate"
                data-testid="button-add-idea"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
              <div className="flex items-center gap-1 ml-auto">
                <Select
                  value={numIdeas.toString()}
                  onValueChange={(value) => setNumIdeas(parseInt(value))}
                >
                  <SelectTrigger className="w-16 h-8 text-xs" data-testid="select-num-ideas">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="40">40</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  size="sm"
                  className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white border-0 hover-elevate active-elevate-2 ${
                    !user || ((user.tokens ?? 0) + (user.purchasedTokens ?? 0)) < (numIdeas / 10) * TOKENS_PER_10_IDEAS ? 'opacity-60' : ''
                  }`}
                  data-testid="button-generate-ideas"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
            {/* Hint: show which occasion will be used for generation */}
            {filterOccasion !== 'all' && (
              <p className="text-xs text-muted-foreground">
                AI ideas will be tagged as "{filterOccasion}"
              </p>
            )}
          </div>

          {/* Saved Ideas Section */}
          <div className="space-y-4">
            <button
              onClick={() => setSavedIdeasCollapsed(!savedIdeasCollapsed)}
              className="w-full text-left flex items-center gap-2 hover-elevate p-2 -m-2 rounded-md"
              data-testid="toggle-saved-ideas"
            >
              <Gift className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold flex-1">
                Saved Ideas ({savedIdeas.length})
              </h2>
              {savedIdeasCollapsed ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            {!savedIdeasCollapsed && (listsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-card animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Inline New Idea Input - spans full width */}
                {newInlineIdea && (
                  <Card className="p-3 md:p-4 border-primary/50 md:col-span-2" data-testid="new-inline-idea">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input
                        ref={newIdeaInputRef}
                        value={newInlineIdea.title}
                        onChange={(e) => setNewInlineIdea({ ...newInlineIdea, title: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveInlineIdea();
                          if (e.key === 'Escape') setNewInlineIdea(null);
                        }}
                        onBlur={handleSaveInlineIdea}
                        placeholder="Type gift idea..."
                        className="flex-1 min-w-0"
                        data-testid="input-new-inline-idea"
                      />
                      <Select 
                        value={newInlineIdea.occasion} 
                        onValueChange={(v) => setNewInlineIdea({ ...newInlineIdea, occasion: v })}
                      >
                        <SelectTrigger className="w-32" data-testid="select-new-idea-occasion">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFAULT_OCCASIONS.map((o: string) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => setNewInlineIdea(null)}
                        variant="ghost"
                        size="icon"
                        className="hover-elevate shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )}
                {savedIdeas.map(idea => (
                  <Card 
                    key={idea.id} 
                    className={`p-2 sm:p-3 ${
                      flashingIdeas.get(idea.id) === 'add' ? 'animate-flash-add' : 
                      flashingIdeas.get(idea.id) === 'remove' ? 'animate-flash-remove' : ''
                    }`}
                    data-testid={`saved-idea-${idea.id}`}
                  >
                    <div className="space-y-1">
                      {/* Row 1: Occasion tag + Purchased toggle */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getOccasionColor(idea.occasion)} hover:opacity-80 transition-opacity`}
                                data-testid={`tag-occasion-${idea.id}`}
                              >
                                {idea.occasion}
                              </button>
                            </PopoverTrigger>
                          <PopoverContent className="w-40 p-1" align="start">
                            <div className="space-y-0.5">
                              {occasionsList.length > 0 ? occasionsList.map((o: string) => (
                                <button
                                  key={o}
                                  onClick={() => handleChangeIdeaOccasion(idea, o)}
                                  className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-muted ${o === idea.occasion ? 'bg-muted font-medium' : ''}`}
                                >
                                  {o}
                                </button>
                              )) : DEFAULT_OCCASIONS.slice(0, 6).map((o: string) => (
                                <button
                                  key={o}
                                  onClick={() => handleChangeIdeaOccasion(idea, o)}
                                  className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-muted ${o === idea.occasion ? 'bg-muted font-medium' : ''}`}
                                >
                                  {o}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                          </Popover>
                          {/* Purchased toggle */}
                          <button
                            onClick={() => togglePurchased(idea.id)}
                            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium transition-all ${
                              purchasedIdeas.has(idea.id)
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            data-testid={`toggle-purchased-${idea.id}`}
                          >
                            {purchasedIdeas.has(idea.id) ? (
                              <>
                                <Check className="h-3 w-3" />
                                Purchased
                              </>
                            ) : (
                              <Gift className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <Button
                          onClick={() => handleRemoveIdea(idea)}
                          variant="ghost"
                          size="icon"
                          className="hover-elevate shrink-0 h-6 w-6"
                          data-testid={`button-remove-idea-${idea.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {/* Row 2: Idea text */}
                      {editingIdea === idea.id ? (
                        <Input
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={() => handleUpdateIdeaTitle(idea, editingText)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateIdeaTitle(idea, editingText);
                            if (e.key === 'Escape') setEditingIdea(null);
                          }}
                          className="w-full text-sm"
                          autoFocus
                          data-testid={`input-edit-idea-${idea.id}`}
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingIdea(idea.id);
                            setEditingText(idea.title);
                          }}
                          className="w-full text-left text-sm font-medium text-foreground hover:underline cursor-text"
                          data-testid={`text-idea-${idea.id}`}
                        >
                          {idea.title}
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ))}
            {!savedIdeasCollapsed && savedIdeas.length === 0 && !newInlineIdea && (
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
                Generated Ideas ({generatedIdeas.length})
              </h2>
              <div className="space-y-2">
                {generatedIdeas.map(idea => (
                  <Card 
                    key={idea.id} 
                    className={`p-2 sm:p-3 ${
                      flashingIdeas.get(idea.id) === 'add' ? 'animate-flash-add' : 
                      flashingIdeas.get(idea.id) === 'remove' ? 'animate-flash-remove' : ''
                    }`}
                    data-testid={`generated-idea-${idea.id}`}
                  >
                    <div className="space-y-1">
                      {/* Row 1: Occasion tag + actions */}
                      <div className="flex items-center justify-between gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${getOccasionColor(idea.occasion)} hover:opacity-80 transition-opacity`}
                              data-testid={`tag-gen-occasion-${idea.id}`}
                            >
                              {idea.occasion}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-1" align="start">
                            <div className="space-y-0.5">
                              {occasionsList.length > 0 ? occasionsList.map((o: string) => (
                                <button
                                  key={o}
                                  onClick={() => handleChangeGeneratedIdeaOccasion(idea, o)}
                                  className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-muted ${o === idea.occasion ? 'bg-muted font-medium' : ''}`}
                                >
                                  {o}
                                </button>
                              )) : DEFAULT_OCCASIONS.slice(0, 6).map((o: string) => (
                                <button
                                  key={o}
                                  onClick={() => handleChangeGeneratedIdeaOccasion(idea, o)}
                                  className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-muted ${o === idea.occasion ? 'bg-muted font-medium' : ''}`}
                                >
                                  {o}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            onClick={() => handleAddAiIdeaToSaved(idea)}
                            variant="outline"
                            size="sm"
                            className="hover-elevate h-6 text-xs px-2"
                            data-testid={`button-add-ai-idea-${idea.id}`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            onClick={() => handleRemoveIdea(idea)}
                            variant="ghost"
                            size="icon"
                            className="hover-elevate h-6 w-6"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {/* Row 2: Idea text + info */}
                      <div className="flex items-start gap-1">
                        <span className="text-sm font-medium text-foreground flex-1">{idea.title}</span>
                        {idea.reason && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 rounded-full hover-elevate shrink-0"
                              >
                                <Info className="h-3 w-3 text-muted-foreground" />
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
            <DialogTitle>Customize Profile First</DialogTitle>
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
              Customize Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
