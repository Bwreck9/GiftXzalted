import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AmazonProductCard } from '@/components/AmazonProductCard';
import type { Profile, Message, User } from '@shared/schema';
import { ArrowLeft, Send, Settings, Coins, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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

const MAX_MESSAGE_LENGTH = 5000;

export default function Chat() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useQuery<Profile>({
    queryKey: ['/api/profiles', id],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages', id],
  });

  const { data: userData } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', '/api/messages', {
        profileId: id,
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setMessage('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/profiles/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({ title: 'Profile deleted', description: 'The profile has been removed.' });
      setLocation('/');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending) return;
    
    if (userData && userData.credits <= 0) {
      toast({
        title: 'No credits remaining',
        description: 'Purchase more credits to continue chatting.',
        variant: 'destructive',
      });
      return;
    }

    sendMutation.mutate(message.trim());
  };

  const parseAmazonLinks = (text: string) => {
    const amazonRegex = /(https?:\/\/)?(www\.)?(amazon\.com\/[^\s]+|amzn\.to\/[^\s]+)/gi;
    const parts: Array<{ type: 'text' | 'link'; content: string }> = [];
    let lastIndex = 0;

    let match;
    while ((match = amazonRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      
      let url = match[0];
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      
      parts.push({ type: 'link', content: url });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: text }];
  };

  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const initials = profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const remainingChars = MAX_MESSAGE_LENGTH - message.length;

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 border-b flex items-center justify-between px-4 bg-background sticky top-0 z-10 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/')}
          data-testid="button-back"
          className="hover-elevate"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold">{profile.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1" data-testid="badge-credits">
            <Coins className="h-3 w-3" />
            {userData?.credits || 0}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-profile-menu" className="hover-elevate">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocation(`/profile/${id}`)} data-testid="menu-edit-profile">
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive"
                data-testid="menu-delete-profile"
              >
                Delete Profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 space-y-4">
        {messages && messages.length === 0 && (
          <Card className="p-6 bg-card">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Profile Summary</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Shopping for <strong>{profile.name}</strong> for their {profile.event}.
                  {profile.age < 13 && ' A young child'}
                  {profile.age >= 13 && profile.age < 20 && ' A teenager'}
                  {profile.age >= 20 && profile.age < 30 && ' A young adult'}
                  {profile.age >= 30 && profile.age < 50 && ' An adult'}
                  {profile.age >= 50 && ' A mature adult'}
                  {' '}who enjoys {profile.interests}.
                </p>
                <p className="text-sm text-muted-foreground">
                  Ask me for gift recommendations, and I'll suggest personalized ideas!
                </p>
              </div>
            </div>
          </Card>
        )}

        {messagesLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              data-testid={`message-${msg.role}-${msg.id}`}
            >
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-card-foreground'
                  }`}
                >
                  {parseAmazonLinks(msg.content).map((part, i) =>
                    part.type === 'link' ? (
                      <div key={i} className="mt-2">
                        <AmazonProductCard url={part.content} />
                      </div>
                    ) : (
                      <p key={i} className="whitespace-pre-wrap break-words">{part.content}</p>
                    )
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 px-2">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className="border-t p-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-muted-foreground">
              {remainingChars} characters remaining
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Ask for gift recommendations..."
              disabled={sendMutation.isPending}
              data-testid="input-message"
              className="h-12 rounded-full"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMutation.isPending}
              size="icon"
              data-testid="button-send"
              className="h-12 w-12 rounded-full hover-elevate active-elevate-2"
            >
              {sendMutation.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {profile.name}'s profile and all chat history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
