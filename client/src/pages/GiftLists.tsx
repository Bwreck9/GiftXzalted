import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Plus, Trash2, ListPlus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { GiftList } from "@shared/schema";

export default function GiftLists() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newListTitle, setNewListTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: lists, isLoading } = useQuery<GiftList[]>({
    queryKey: ["/api/gift-lists"],
    enabled: !!user,
  });

  const createListMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/gift-lists", { title });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists"] });
      setNewListTitle("");
      setIsCreating(false);
      toast({
        title: "List created",
        description: "Your gift list has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create gift list",
        variant: "destructive",
      });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/gift-lists/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists"] });
      toast({
        title: "List deleted",
        description: "Your gift list has been deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete gift list",
        variant: "destructive",
      });
    },
  });

  const handleCreateList = () => {
    if (newListTitle.trim()) {
      createListMutation.mutate(newListTitle);
    }
  };

  const handleDeleteList = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this list?")) {
      deleteListMutation.mutate(id);
    }
  };

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-muted-foreground">Please sign in to manage your gift lists</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            data-testid="button-back-home"
            className="hover-elevate active-elevate-2"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">My Gift Lists</h1>
            <p className="text-muted-foreground">
              Keep track of gift ideas for anyone in your life - completely free!
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          data-testid="button-create-list"
        >
          <Plus className="h-4 w-4 mr-2" />
          New List
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Gift List</CardTitle>
            <CardDescription>Give your list a name to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Ideas for Mom's Birthday"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateList();
                  }
                }}
                maxLength={200}
                data-testid="input-list-title"
              />
              <Button
                onClick={handleCreateList}
                disabled={!newListTitle.trim() || createListMutation.isPending}
                data-testid="button-save-list"
              >
                {createListMutation.isPending ? "Creating..." : "Create"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewListTitle("");
                }}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your lists...</p>
        </div>
      ) : lists && lists.length > 0 ? (
        <div className="grid gap-4">
          {lists.map((list) => (
            <Link key={list.id} to={`/gift-lists/${list.id}`} data-testid={`link-list-${list.id}`}>
              <Card className="hover-elevate active-elevate-2 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-xl" data-testid={`text-list-title-${list.id}`}>
                        {list.title}
                      </CardTitle>
                      <CardDescription>
                        Updated {new Date(list.updatedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteList(list.id, e)}
                      data-testid={`button-delete-list-${list.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ListPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No gift lists yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first list to start organizing gift ideas
            </p>
            <Button onClick={() => setIsCreating(true)} data-testid="button-create-first-list">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First List
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
