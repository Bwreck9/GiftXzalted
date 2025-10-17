import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Brain, Calendar, Settings, Trash2, ArrowLeft } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import type { Profile, GiftList } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { QuestionnaireDialog } from '@/components/QuestionnaireDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PATCH', `/api/profiles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', id] });
      toast({ title: 'Profile updated successfully' });
      setQuestionnaireOpen(false);
    },
    onError: () => {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    },
  });

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ['/api/profiles', id],
    queryFn: async () => {
      const res = await fetch(`/api/profiles/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
  });

  const { data: giftLists, isLoading: listsLoading } = useQuery<GiftList[]>({
    queryKey: ['/api/profiles', id, 'gift-lists'],
    queryFn: async () => {
      const res = await fetch(`/api/profiles/${id}/gift-lists`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch gift lists');
      return res.json();
    },
    enabled: !!id,
  });

  const createListMutation = useMutation({
    mutationFn: async (title: string) => {
      return apiRequest('POST', `/api/profiles/${id}/gift-lists`, { title });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', id, 'gift-lists'] });
      toast({ title: 'Gift list created successfully' });
      setCreateDialogOpen(false);
      setNewListName('');
      response.json().then((list: GiftList) => {
        setLocation(`/gift-list/${list.id}`);
      });
    },
    onError: () => {
      toast({ title: 'Failed to create gift list', variant: 'destructive' });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      return apiRequest('DELETE', `/api/gift-lists/${listId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', id, 'gift-lists'] });
      toast({ title: 'Gift list deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete gift list', variant: 'destructive' });
    },
  });

  const handleCreateList = () => {
    if (!newListName.trim()) {
      toast({ title: 'Please enter a name', variant: 'destructive' });
      return;
    }
    createListMutation.mutate(newListName);
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
      />

      <AppHeader />
      
      {/* Profile Info Bar */}
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
              {profile.relationship && (
                <p className="text-sm text-muted-foreground">{profile.relationship}</p>
              )}
            </div>
          </div>
          <Button
            onClick={() => setQuestionnaireOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white border-0 hover-elevate active-elevate-2"
            data-testid="button-train-agent"
          >
            <Brain className="h-4 w-4 mr-2" />
            Train Agent
          </Button>
        </div>
      </div>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setLocation('/')}
                variant="outline"
                className="hover-elevate active-elevate-2"
                data-testid="button-back-to-profiles"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to profiles
              </Button>
              <h2 className="text-2xl font-bold">Gift Lists</h2>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="hover-elevate active-elevate-2"
              data-testid="button-create-list"
            >
              <Plus className="h-4 w-4 mr-2" />
              New List
            </Button>
          </div>

          {listsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-card animate-pulse rounded-lg" />
              ))}
            </div>
          ) : giftLists && giftLists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {giftLists.map(list => (
                <button
                  key={list.id}
                  onClick={() => setLocation(`/gift-list/${list.id}`)}
                  className="w-full p-4 rounded-lg border bg-card hover-elevate active-elevate-2 text-left"
                  data-testid={`gift-list-card-${list.id}`}
                >
                  <div className="flex items-start gap-3">
                    <Calendar className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">{list.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {list.manualIdeas?.length || 0} ideas
                      </p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover-elevate shrink-0"
                          data-testid={`list-menu-${list.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm(`Delete list "${list.title}"?`)) {
                              deleteListMutation.mutate(list.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <p className="text-muted-foreground text-lg">No gift lists yet</p>
              <p className="text-sm text-muted-foreground">
                Create a list for an occasion like "Birthday" or "Christmas"
              </p>
            </div>
          )}
        </div>
      </main>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-list">
          <DialogHeader>
            <DialogTitle>Create Gift List</DialogTitle>
            <DialogDescription>
              Enter a name for the occasion (e.g., "Birthday", "Christmas", "Anniversary")
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="list-name">List Name</Label>
              <Input
                id="list-name"
                placeholder="e.g., Birthday"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !createListMutation.isPending) {
                    handleCreateList();
                  }
                }}
                maxLength={20}
                data-testid="input-list-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateList}
              disabled={createListMutation.isPending}
              className="hover-elevate active-elevate-2"
              data-testid="button-create-list-submit"
            >
              {createListMutation.isPending ? 'Creating...' : 'Create List'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
