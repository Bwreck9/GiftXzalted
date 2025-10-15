import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Settings, ArrowLeft, Sparkles, Plus, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { QuestionnaireDialog } from '@/components/QuestionnaireDialog';
import type { Profile } from '@shared/schema';

export default function ProfileDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionnaireDialogOpen, setQuestionnaireDialogOpen] = useState(false);
  const [manualIdeas, setManualIdeas] = useState<string[]>([]);

  // Fetch profile data
  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['/api/profiles', id],
    select: (data) => {
      // Initialize manual ideas state when profile loads
      if (data.manualIdeas && manualIdeas.length === 0) {
        setManualIdeas(data.manualIdeas.length > 0 ? [...data.manualIdeas] : ['', '', '', '', '']);
      } else if (!data.manualIdeas || data.manualIdeas.length === 0) {
        setManualIdeas(['', '', '', '', '']);
      }
      return data;
    },
  });

  // Update manual ideas mutation
  const updateIdeasMutation = useMutation({
    mutationFn: async (ideas: string[]) => {
      return apiRequest('PATCH', `/api/profiles/${id}`, { manualIdeas: ideas });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({ title: 'Ideas saved successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to save ideas', variant: 'destructive' });
    },
  });

  // Update questionnaire data mutation
  const updateQuestionnaireMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PATCH', `/api/profiles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      setQuestionnaireDialogOpen(false);
      // After updating questionnaire, trigger AI generation
      generateMutation.mutate();
    },
    onError: () => {
      toast({ title: 'Failed to save questionnaire', variant: 'destructive' });
    },
  });

  // Delete profile mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({ title: 'Gift list deleted successfully' });
      setLocation('/');
    },
    onError: () => {
      toast({ title: 'Failed to delete gift list', variant: 'destructive' });
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

  const handleUpdateIdea = (index: number, value: string) => {
    const newIdeas = [...manualIdeas];
    newIdeas[index] = value;
    setManualIdeas(newIdeas);
  };

  const handleAddMoreIdeas = () => {
    setManualIdeas([...manualIdeas, '', '', '']);
  };

  const handleRemoveIdea = (index: number) => {
    const newIdeas = manualIdeas.filter((_, i) => i !== index);
    setManualIdeas(newIdeas);
    // Save immediately after removing
    updateIdeasMutation.mutate(newIdeas.filter(idea => idea.trim() !== ''));
  };

  const handleSaveIdeas = () => {
    // Filter out empty ideas before saving
    const filteredIdeas = manualIdeas.filter(idea => idea.trim() !== '');
    updateIdeasMutation.mutate(filteredIdeas);
  };

  const handleGenerateResponses = () => {
    // Check if questionnaire is filled
    if (!profile?.age || !profile?.gender || !profile?.interests || !profile?.personality) {
      // Show questionnaire dialog
      setQuestionnaireDialogOpen(true);
      return;
    }
    
    generateMutation.mutate();
  };

  const handleQuestionnaireSubmit = (data: any) => {
    updateQuestionnaireMutation.mutate(data);
  };

  const handleDeleteProfile = () => {
    deleteMutation.mutate();
  };

  // Parse premium results if available
  const premiumResults = profile?.premiumResults 
    ? (typeof profile.premiumResults === 'string' 
        ? JSON.parse(profile.premiumResults) 
        : profile.premiumResults)
    : null;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Gift list not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gift List?</AlertDialogTitle>
            <AlertDialogDescription>
              Please confirm that you want to delete "{profile.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProfile} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Questionnaire Dialog */}
      <QuestionnaireDialog
        open={questionnaireDialogOpen}
        onOpenChange={setQuestionnaireDialogOpen}
        onSubmit={handleQuestionnaireSubmit}
        isSubmitting={updateQuestionnaireMutation.isPending}
      />

      {/* Header */}
      <header className="h-16 border-b flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            data-testid="button-back"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{profile.name}</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-settings"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive"
              data-testid="button-delete-profile"
            >
              Delete Gift List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Manual Gift Ideas */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Gift Ideas</h2>
            <div className="space-y-3">
              {manualIdeas.map((idea, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={idea}
                    onChange={(e) => handleUpdateIdea(index, e.target.value)}
                    placeholder={`Gift idea #${index + 1}`}
                    data-testid={`input-gift-idea-${index}`}
                  />
                  {manualIdeas.length > 5 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveIdea(index)}
                      data-testid={`button-remove-idea-${index}`}
                      aria-label="Remove idea"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddMoreIdeas}
                variant="outline"
                size="sm"
                data-testid="button-add-more-ideas"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add More Ideas
              </Button>
              <Button
                onClick={handleSaveIdeas}
                size="sm"
                disabled={updateIdeasMutation.isPending}
                data-testid="button-save-ideas"
              >
                {updateIdeasMutation.isPending ? 'Saving...' : 'Save Ideas'}
              </Button>
            </div>
          </div>

          {/* Generate Responses Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleGenerateResponses}
              className="w-full"
              size="lg"
              disabled={generateMutation.isPending}
              data-testid="button-generate-responses"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {generateMutation.isPending ? 'Generating...' : 'GENERATE RESPONSES'}
            </Button>
          </div>

          {/* AI Recommendations */}
          {premiumResults && Array.isArray(premiumResults) && premiumResults.length > 0 && (
            <div className="space-y-4 pt-6 border-t">
              <h2 className="text-lg font-semibold">AI Recommendations</h2>
              <div className="space-y-3">
                {premiumResults.map((result: any, index: number) => (
                  <div key={result.id || index} className="space-y-2">
                    <Input
                      value={result.title}
                      readOnly
                      data-testid={`input-ai-gift-${index}`}
                    />
                    <Input
                      value={result.reason}
                      readOnly
                      className="text-sm text-muted-foreground"
                      data-testid={`input-ai-reason-${index}`}
                    />
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
