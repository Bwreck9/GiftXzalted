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
import { Slider } from '@/components/ui/slider';
import { 
  Plus, Brain, Settings, Trash2, ArrowLeft, Pencil, Sparkles, 
  Loader2, X, Info, Calendar, ChevronDown, ChevronUp, Check, Gift, GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AppHeader } from '@/components/AppHeader';
import type { Profile, GiftList } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { QuestionnaireDialog } from '@/components/QuestionnaireDialog';
import { SettingsModal } from '@/components/SettingsModal';
import { ImportantDatesModal } from '@/components/ImportantDatesModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

// Reorder items for column-first display in 2-column grid
// Transforms [1,2,3,4,5,6,7,8] → [1,5,2,6,3,7,4,8] for column-first appearance
function reorderForColumns<T>(items: T[]): T[] {
  const len = items.length;
  if (len <= 1) return items;
  const half = Math.ceil(len / 2);
  const result: T[] = [];
  for (let i = 0; i < half; i++) {
    result.push(items[i]);
    if (i + half < len) {
      result.push(items[i + half]);
    }
  }
  return result;
}

interface UnifiedIdea {
  id: string;
  title: string;
  occasion: string;
  reason?: string;
  isAiGenerated?: boolean;
  giftListId: string;
}

// Sortable idea card component for drag and drop
interface SortableIdeaCardProps {
  idea: UnifiedIdea;
  children: React.ReactNode;
  flashType?: 'add' | 'remove';
}

function SortableIdeaCard({ idea, children, flashType }: SortableIdeaCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: idea.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };
  
  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`p-2 sm:p-3 ${
        flashType === 'add' ? 'animate-flash-add' : 
        flashType === 'remove' ? 'animate-flash-remove' : ''
      }`}
      data-testid={`saved-idea-${idea.id}`}
    >
      <div className="flex gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground shrink-0 mt-1"
          data-testid={`drag-handle-${idea.id}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </Card>
  );
}

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
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
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [occasionManagerOpen, setOccasionManagerOpen] = useState(false);
  const [occasionToEdit, setOccasionToEdit] = useState<string | null>(null);
  const [occasionEditName, setOccasionEditName] = useState('');
  const [newOccasionName, setNewOccasionName] = useState('');
  const [occasionToDelete, setOccasionToDelete] = useState<string | null>(null);
  const [deleteReassignTo, setDeleteReassignTo] = useState<string>('');
  const [importantDatesOpen, setImportantDatesOpen] = useState(false);
  const [importantDatesCollapsed, setImportantDatesCollapsed] = useState(true);
  const [editingIdea, setEditingIdea] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [orderedSavedIdeas, setOrderedSavedIdeas] = useState<UnifiedIdea[]>([]);
  const newIdeaInputRef = useRef<HTMLInputElement>(null);
  
  // DnD sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle ?train=true query parameter - open questionnaire directly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('train') === 'true') {
      setQuestionnaireOpen(true);
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
    enabled: !authLoading && !!user && !!id,
  });

  const { data: giftLists, isLoading: listsLoading } = useQuery<GiftList[]>({
    queryKey: [`/api/profiles/${id}/gift-lists`],
    enabled: !authLoading && !!user && !!id,
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

  const savedIdeasFromData = filteredIdeas.filter(idea => !idea.isAiGenerated);
  const generatedIdeas = filteredIdeas.filter(idea => idea.isAiGenerated);

  // Sync ordered saved ideas with data (preserve user order if possible)
  useEffect(() => {
    // Only reset order if this looks like fresh data (e.g., initial load or filter change)
    // When deleting, orderedSavedIdeas will already have the item removed
    if (orderedSavedIdeas.length === 0) {
      setOrderedSavedIdeas(savedIdeasFromData);
    } else {
      // Update existing order with new data, matching by title since IDs change on delete
      const dataByTitle = new Map(savedIdeasFromData.map(i => [i.title + '|' + i.occasion, i]));
      const updatedOrder = orderedSavedIdeas
        .map(ordered => dataByTitle.get(ordered.title + '|' + ordered.occasion))
        .filter((i): i is UnifiedIdea => i !== undefined);
      
      // Add any new ideas that weren't in our order (newly added)
      const orderedTitles = new Set(updatedOrder.map(i => i.title + '|' + i.occasion));
      const newIdeas = savedIdeasFromData.filter(i => !orderedTitles.has(i.title + '|' + i.occasion));
      
      // New manually added ideas go to the top
      setOrderedSavedIdeas([...newIdeas, ...updatedOrder]);
    }
  }, [JSON.stringify(savedIdeasFromData.map(i => i.title + '|' + i.occasion))]);
  
  // Use ordered ideas for display, falling back to data if order state is empty
  const savedIdeas = orderedSavedIdeas.length > 0 ? orderedSavedIdeas : savedIdeasFromData;

  const occasionsList = Array.from(new Set((giftLists || []).map(list => list.title)));

  // Handle drag end for reordering saved ideas
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = savedIdeas.findIndex(idea => idea.id === active.id);
    const newIndex = savedIdeas.findIndex(idea => idea.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    // Update local state immediately for smooth UX
    const reorderedIdeas = arrayMove(savedIdeas, oldIndex, newIndex);
    setOrderedSavedIdeas(reorderedIdeas);
    
    // Group by gift list and persist new order
    const listIdToIdeas = new Map<string, string[]>();
    reorderedIdeas.forEach(idea => {
      const ideas = listIdToIdeas.get(idea.giftListId) || [];
      ideas.push(idea.title);
      listIdToIdeas.set(idea.giftListId, ideas);
    });
    
    // Persist to each list
    await Promise.all(
      Array.from(listIdToIdeas.entries()).map(([listId, ideas]) =>
        apiRequest('PATCH', `/api/gift-lists/${listId}`, { manualIdeas: ideas })
      )
    );
    
    queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
  };

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
    
    // Remove from purchased set - since IDs are index-based, we need to clear
    // both this ID and all IDs from this list that come after it (they will shift)
    setPurchasedIdeas(prev => {
      const next = new Set(prev);
      // Remove the deleted item's ID
      next.delete(idea.id);
      // Also remove any IDs from the same list with higher indices (they will shift)
      const idPrefix = `${list.id}-manual-`;
      const deletedIndex = parseInt(idea.id.split('-manual-')[1] || '-1');
      if (deletedIndex >= 0) {
        prev.forEach(purchasedId => {
          if (purchasedId.startsWith(idPrefix)) {
            const idx = parseInt(purchasedId.split('-manual-')[1] || '-1');
            if (idx > deletedIndex) {
              next.delete(purchasedId);
            }
          }
        });
      }
      return next;
    });

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

  const handleClearAllGeneratedIdeas = async () => {
    // Clear all premiumResults from all gift lists
    const lists = giftLists || [];
    await Promise.all(
      lists.map(list => 
        apiRequest('PATCH', `/api/gift-lists/${list.id}`, { premiumResults: JSON.stringify([]) })
      )
    );
    
    queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
    setClearAllDialogOpen(false);
    toast({ title: 'All generated ideas cleared' });
  };

  // Occasion Manager handlers
  const handleAddOccasion = async () => {
    if (!newOccasionName.trim()) {
      toast({ title: 'Please enter an occasion name', variant: 'destructive' });
      return;
    }
    
    // Check if occasion already exists
    if (occasionsList.includes(newOccasionName.trim())) {
      toast({ title: 'This occasion already exists', variant: 'destructive' });
      return;
    }
    
    // Create a new gift list for this occasion
    await createListMutation.mutateAsync({ title: newOccasionName.trim() });
    setNewOccasionName('');
    toast({ title: 'Occasion added' });
  };

  const handleRenameOccasion = async (oldName: string, newName: string) => {
    if (!newName.trim() || newName.trim() === oldName) {
      setOccasionToEdit(null);
      return;
    }
    
    // Check if new name already exists
    if (occasionsList.includes(newName.trim()) && newName.trim() !== oldName) {
      toast({ title: 'This occasion already exists', variant: 'destructive' });
      return;
    }
    
    // Find the list with this occasion and rename it
    const list = (giftLists || []).find(l => l.title === oldName);
    if (list) {
      await apiRequest('PATCH', `/api/gift-lists/${list.id}`, { title: newName.trim() });
      queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
      
      // Update filter if we were filtering by the renamed occasion
      if (filterOccasion === oldName) {
        setFilterOccasion(newName.trim());
      }
      
      toast({ title: 'Occasion renamed' });
    }
    setOccasionToEdit(null);
  };

  const handleDeleteOccasion = async () => {
    if (!occasionToDelete) return;
    
    const list = (giftLists || []).find(l => l.title === occasionToDelete);
    if (!list) return;
    
    const hasIdeas = (list.manualIdeas?.length || 0) > 0 || 
                     (list.premiumResults && JSON.parse(list.premiumResults).length > 0);
    
    if (hasIdeas && deleteReassignTo) {
      // Move ideas to new occasion
      const targetList = (giftLists || []).find(l => l.title === deleteReassignTo);
      if (targetList) {
        // Move manual ideas
        const combinedManual = [...(targetList.manualIdeas || []), ...(list.manualIdeas || [])];
        await apiRequest('PATCH', `/api/gift-lists/${targetList.id}`, { manualIdeas: combinedManual });
        
        // Move AI ideas
        try {
          const sourceAi = list.premiumResults ? JSON.parse(list.premiumResults) : [];
          const targetAi = targetList.premiumResults ? JSON.parse(targetList.premiumResults) : [];
          const combinedAi = [...targetAi, ...sourceAi];
          await apiRequest('PATCH', `/api/gift-lists/${targetList.id}`, { premiumResults: JSON.stringify(combinedAi) });
        } catch (e) {
          console.error('Failed to move AI ideas:', e);
        }
      }
    }
    
    // Delete the list
    await apiRequest('DELETE', `/api/gift-lists/${list.id}`);
    queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}/gift-lists`] });
    
    // Reset filter if we were filtering by the deleted occasion
    if (filterOccasion === occasionToDelete) {
      setFilterOccasion('all');
    }
    
    setOccasionToDelete(null);
    setDeleteReassignTo('');
    toast({ title: 'Occasion deleted' });
  };

  const getOccasionIdeaCount = (occasion: string) => {
    const list = (giftLists || []).find(l => l.title === occasion);
    if (!list) return 0;
    const manualCount = list.manualIdeas?.length || 0;
    let aiCount = 0;
    try {
      if (list.premiumResults) {
        aiCount = JSON.parse(list.premiumResults).length;
      }
    } catch (e) {}
    return manualCount + aiCount;
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

    // Find the index position of this idea in the old list
    const oldIdeas = oldList.manualIdeas || [];
    const ideaIndex = oldIdeas.indexOf(idea.title);
    
    // Remove from old list
    const updatedOldIdeas = oldIdeas.filter(i => i !== idea.title);
    await apiRequest('PATCH', `/api/gift-lists/${oldList.id}`, { manualIdeas: updatedOldIdeas });

    // Add to new list (create if needed)
    let newList = (giftLists || []).find(l => l.title === newOccasion);
    if (!newList) {
      const response = await createListMutation.mutateAsync({ title: newOccasion });
      newList = await response.json();
    }

    if (newList) {
      const existingNewIdeas = newList.manualIdeas || [];
      // Insert at the same position (or beginning) to minimize movement
      const insertIndex = Math.min(ideaIndex, existingNewIdeas.length);
      const newIdeas = [
        ...existingNewIdeas.slice(0, insertIndex),
        idea.title,
        ...existingNewIdeas.slice(insertIndex)
      ];
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

  if (authLoading || profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Please sign in to view this profile</div>
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

      <ImportantDatesModal
        open={importantDatesOpen}
        onOpenChange={setImportantDatesOpen}
        profile={profile}
        onSave={(updates) => updateProfileMutation.mutate(updates)}
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
          {/* Important Dates Section - Collapsible, only show if dates exist */}
          {profile.importantDates && (profile.importantDates as any[]).length > 0 && (profile.importantDates as any[]).some((d: any) => d.date) && (
            <div className="rounded-lg bg-muted/30 border">
              <button
                onClick={() => setImportantDatesCollapsed(!importantDatesCollapsed)}
                className="flex items-center justify-between w-full p-3 hover-elevate rounded-lg"
                data-testid="button-toggle-important-dates"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Important Dates</span>
                </div>
                {importantDatesCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {!importantDatesCollapsed && (
                <div className="px-3 pb-3 space-y-2">
                  {(profile.importantDates as any[]).filter((d: any) => d.date).map((importantDate: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Gift className="h-3.5 w-3.5 text-pink-500" />
                      <span className="text-muted-foreground">{importantDate.name}:</span>
                      <span className="font-medium">
                        {(() => {
                          const [month, day] = importantDate.date.split('-');
                          const date = new Date(2000, parseInt(month) - 1, parseInt(day));
                          const formatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                          return importantDate.year ? `${formatted}, ${importantDate.year}` : formatted;
                        })()}
                      </span>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImportantDatesOpen(true)}
                    className="hover-elevate mt-2"
                    data-testid="button-edit-important-dates"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit Dates
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Actions Row - Mobile friendly stacked layout */}
          <div className="space-y-3">
            {/* Occasion Filter with Manager */}
            <div className="flex items-center gap-2">
              <Select value={filterOccasion} onValueChange={setFilterOccasion}>
                <SelectTrigger className="w-44" data-testid="select-filter-occasion">
                  <SelectValue placeholder="All occasions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All occasions</SelectItem>
                  {occasionsList.map((occasion: string) => (
                    <SelectItem key={occasion} value={occasion}>{occasion}</SelectItem>
                  ))}
                  <div className="border-t my-1" />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setOccasionManagerOpen(true);
                    }}
                    className="w-full text-left text-sm px-2 py-1.5 text-primary hover:bg-muted rounded-sm flex items-center gap-1"
                    data-testid="button-add-occasion-filter"
                  >
                    <Plus className="h-3 w-3" />
                    Add occasion
                  </button>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOccasionManagerOpen(true)}
                className="hover-elevate"
                data-testid="button-occasion-manager"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
          </div>

          {/* Saved Ideas Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSavedIdeasCollapsed(!savedIdeasCollapsed)}
                className="text-left flex items-center gap-2 hover-elevate p-2 -m-2 rounded-md"
                data-testid="toggle-saved-ideas"
              >
                <Gift className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  Saved Ideas ({savedIdeas.filter(i => !purchasedIdeas.has(i.id)).length})
                </h2>
                {savedIdeasCollapsed ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <Button
                onClick={handleAddInlineIdea}
                variant="outline"
                size="sm"
                className="hover-elevate"
                data-testid="button-add-idea"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Idea
              </Button>
            </div>
            {!savedIdeasCollapsed && (listsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-card animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Inline New Idea Input */}
                  {newInlineIdea && (
                    <Card className="p-3 md:p-4 border-primary/50" data-testid="new-inline-idea">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Input
                          ref={newIdeaInputRef}
                          value={newInlineIdea.title}
                          onChange={(e) => setNewInlineIdea({ ...newInlineIdea, title: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveInlineIdea();
                            if (e.key === 'Escape') setNewInlineIdea(null);
                          }}
                          placeholder="Type gift idea..."
                          className="flex-1 min-w-0"
                          maxLength={100}
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
                            {(occasionsList.length > 0 ? occasionsList : DEFAULT_OCCASIONS.slice(0, 6)).map((o: string) => (
                              <SelectItem key={o} value={o}>{o}</SelectItem>
                            ))}
                            <div className="border-t my-1" />
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setOccasionManagerOpen(true);
                              }}
                              className="w-full text-left text-sm px-2 py-1.5 text-primary hover:bg-muted rounded-sm flex items-center gap-1"
                              data-testid="button-add-occasion-inline"
                            >
                              <Plus className="h-3 w-3" />
                              Add occasion
                            </button>
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
                  <SortableContext
                    items={savedIdeas.filter(i => !purchasedIdeas.has(i.id)).map(idea => idea.id)}
                    strategy={rectSortingStrategy}
                  >
                    {savedIdeas.filter(idea => !purchasedIdeas.has(idea.id)).map(idea => (
                      <SortableIdeaCard 
                        key={idea.id} 
                        idea={idea}
                        flashType={flashingIdeas.get(idea.id)}
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
                              {/* Mark as Purchased button */}
                              <button
                                onClick={() => togglePurchased(idea.id)}
                                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium transition-all bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-300"
                                title="Mark as purchased"
                                data-testid={`toggle-purchased-${idea.id}`}
                              >
                                <Gift className="h-3 w-3" />
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
                              maxLength={100}
                              autoFocus
                              data-testid={`input-edit-idea-${idea.id}`}
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setEditingIdea(idea.id);
                                setEditingText(idea.title);
                              }}
                              className="w-full text-left text-sm font-medium text-foreground hover:underline cursor-text break-words overflow-hidden"
                              data-testid={`text-idea-${idea.id}`}
                            >
                              {idea.title}
                            </button>
                          )}
                        </div>
                      </SortableIdeaCard>
                    ))}
                  </SortableContext>
                </div>
              </DndContext>
            ))}
            {!savedIdeasCollapsed && savedIdeas.filter(i => !purchasedIdeas.has(i.id)).length === 0 && !newInlineIdea && (
              <div className="text-center py-8 rounded-lg border bg-card/50">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No saved ideas yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add ideas manually or generate AI recommendations
                </p>
              </div>
            )}
          </div>

          {/* Generated Ideas Section - Always visible */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Generated Ideas ({generatedIdeas.length})
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1 items-center">
                  <div className="flex items-center gap-2 min-w-32 max-w-40">
                    <span className="text-sm font-medium w-6 text-center" data-testid="display-num-ideas">{numIdeas}</span>
                    <Slider
                      value={[numIdeas]}
                      onValueChange={([value]) => setNumIdeas(value)}
                      min={10}
                      max={50}
                      step={10}
                      className="flex-1"
                      data-testid="slider-num-ideas"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground" data-testid="display-token-cost">
                    {(numIdeas / 10) * TOKENS_PER_10_IDEAS} tokens
                  </span>
                </div>
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
                {generatedIdeas.length > 0 && (
                  <Button
                    onClick={() => setClearAllDialogOpen(true)}
                    variant="ghost"
                    size="sm"
                    className="hover-elevate text-muted-foreground"
                    data-testid="button-clear-all-generated"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>
            {filterOccasion !== 'all' && (
              <p className="text-xs text-muted-foreground">
                AI ideas will be tagged as "{filterOccasion}"
              </p>
            )}
            {generatedIdeas.length > 0 ? (
              <>
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
                          <span className="text-sm font-medium text-foreground flex-1 break-words overflow-hidden">{idea.title}</span>
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
              </>
            ) : (
              <div className="text-center py-8 rounded-lg border bg-card/50">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No generated ideas yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the Generate button to get AI recommendations
                </p>
              </div>
            )}
          </div>

          {/* Purchased Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Purchased ({savedIdeas.filter(i => purchasedIdeas.has(i.id)).length})
            </h2>
            {savedIdeas.filter(i => purchasedIdeas.has(i.id)).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {savedIdeas.filter(idea => purchasedIdeas.has(idea.id)).map(idea => (
                  <Card 
                    key={idea.id}
                    className="p-2 sm:p-3 animate-in fade-in slide-in-from-top-2 duration-300"
                    data-testid={`purchased-idea-${idea.id}`}
                  >
                    <div className="flex gap-2">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getOccasionColor(idea.occasion)}`}>
                              {idea.occasion}
                            </span>
                            <button
                              onClick={() => togglePurchased(idea.id)}
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:opacity-80 transition-opacity"
                              data-testid={`unpurchase-${idea.id}`}
                            >
                              <Check className="h-3 w-3" />
                              Purchased
                            </button>
                          </div>
                          <Button
                            onClick={() => handleRemoveIdea(idea)}
                            variant="ghost"
                            size="icon"
                            className="hover-elevate shrink-0 h-6 w-6"
                            data-testid={`button-remove-purchased-${idea.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-medium text-foreground block break-words overflow-hidden">
                          {idea.title}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 rounded-lg border bg-card/50">
                <Check className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No purchased items yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click the gift icon on saved ideas to mark them as purchased
                </p>
              </div>
            )}
          </div>
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
        <DialogContent hideCloseButton data-testid="dialog-questionnaire-prompt">
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

      {/* Clear All Generated Ideas Confirmation */}
      <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent data-testid="dialog-clear-all">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Generated Ideas?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {generatedIdeas.length} AI-generated ideas. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-clear-all">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearAllGeneratedIdeas}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-clear-all"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Occasion Manager Dialog */}
      <Dialog open={occasionManagerOpen} onOpenChange={setOccasionManagerOpen}>
        <DialogContent className="max-w-md" hideCloseButton data-testid="dialog-occasion-manager">
          <DialogHeader>
            <DialogTitle>Manage Occasions</DialogTitle>
            <DialogDescription>
              Add, rename, or delete occasions for organizing gift ideas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Add New Occasion */}
            <div className="flex items-center gap-2">
              <Input
                value={newOccasionName}
                onChange={(e) => setNewOccasionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddOccasion()}
                placeholder="New occasion name..."
                className="flex-1"
                data-testid="input-new-occasion"
              />
              <Button
                onClick={handleAddOccasion}
                size="sm"
                className="hover-elevate"
                data-testid="button-add-occasion"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            {/* Occasions List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {occasionsList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No occasions yet. Add one above.
                </p>
              ) : (
                occasionsList.map((occasion: string) => (
                  <div 
                    key={occasion} 
                    className="flex items-center gap-2 p-2 rounded-lg border bg-card"
                    data-testid={`occasion-item-${occasion}`}
                  >
                    {occasionToEdit === occasion ? (
                      <Input
                        value={occasionEditName}
                        onChange={(e) => setOccasionEditName(e.target.value)}
                        onBlur={() => handleRenameOccasion(occasion, occasionEditName)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameOccasion(occasion, occasionEditName);
                          if (e.key === 'Escape') setOccasionToEdit(null);
                        }}
                        className="flex-1"
                        autoFocus
                        data-testid={`input-edit-occasion-${occasion}`}
                      />
                    ) : (
                      <>
                        <span className="flex-1 font-medium">{occasion}</span>
                        <span className="text-xs text-muted-foreground">
                          {getOccasionIdeaCount(occasion)} ideas
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 hover-elevate"
                              data-testid={`button-occasion-menu-${occasion}`}
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setOccasionToEdit(occasion);
                                setOccasionEditName(occasion);
                              }}
                              data-testid={`button-rename-occasion-${occasion}`}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setOccasionToDelete(occasion);
                                setDeleteReassignTo('');
                              }}
                              className="text-destructive focus:text-destructive"
                              data-testid={`button-delete-occasion-${occasion}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOccasionManagerOpen(false)} data-testid="button-cancel-occasion-manager">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Occasion Confirmation with Reassignment */}
      <AlertDialog open={!!occasionToDelete} onOpenChange={(open) => !open && setOccasionToDelete(null)}>
        <AlertDialogContent data-testid="dialog-delete-occasion">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{occasionToDelete}"?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {getOccasionIdeaCount(occasionToDelete || '') > 0 ? (
                <>
                  <p>This occasion has {getOccasionIdeaCount(occasionToDelete || '')} ideas. Choose what to do with them:</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deleteAction"
                        checked={deleteReassignTo === ''}
                        onChange={() => setDeleteReassignTo('')}
                        className="accent-primary"
                      />
                      <span>Delete all ideas</span>
                    </label>
                    <label className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="deleteAction"
                        checked={deleteReassignTo !== ''}
                        onChange={() => setDeleteReassignTo(occasionsList.find(o => o !== occasionToDelete) || '')}
                        className="accent-primary mt-1"
                      />
                      <span>Move ideas to another occasion:</span>
                    </label>
                    {deleteReassignTo !== '' && (
                      <Select value={deleteReassignTo} onValueChange={setDeleteReassignTo}>
                        <SelectTrigger className="w-full ml-6" data-testid="select-reassign-occasion">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {occasionsList.filter(o => o !== occasionToDelete).map((o: string) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </>
              ) : (
                <p>This occasion has no ideas. Are you sure you want to delete it?</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-occasion">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteOccasion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-occasion"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
