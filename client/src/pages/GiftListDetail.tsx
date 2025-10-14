import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Plus, Trash2, Check, X, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { GiftList, GiftItem } from "@shared/schema";

export default function GiftListDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newItemText, setNewItemText] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedItemText, setEditedItemText] = useState("");

  const { data: list, isLoading: listLoading } = useQuery<GiftList>({
    queryKey: ["/api/gift-lists", id],
    enabled: !!user && !!id,
  });

  const { data: items, isLoading: itemsLoading } = useQuery<GiftItem[]>({
    queryKey: ["/api/gift-lists", id, "items"],
    enabled: !!user && !!id,
  });

  const updateTitleMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("PATCH", `/api/gift-lists/${id}`, { title });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists"] });
      setEditingTitle(false);
      toast({
        title: "Title updated",
        description: "List title has been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update list title",
        variant: "destructive",
      });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (text: string) => {
      const maxOrder = items ? Math.max(...items.map((i: GiftItem) => i.order), -1) : -1;
      const res = await apiRequest("POST", `/api/gift-lists/${id}/items`, { text, order: maxOrder + 1 });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists", id, "items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists", id] });
      setNewItemText("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: Partial<GiftItem> }) => {
      const res = await apiRequest("PATCH", `/api/gift-lists/${id}/items/${itemId}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists", id, "items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists", id] });
      setEditingItemId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await apiRequest("DELETE", `/api/gift-lists/${id}/items/${itemId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists", id, "items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists", id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const handleAddItem = () => {
    if (newItemText.trim()) {
      createItemMutation.mutate(newItemText);
    }
  };

  const handleUpdateTitle = () => {
    if (editedTitle.trim() && editedTitle !== list?.title) {
      updateTitleMutation.mutate(editedTitle);
    } else {
      setEditingTitle(false);
    }
  };

  const handleToggleCompleted = (item: GiftItem) => {
    updateItemMutation.mutate({
      itemId: item.id,
      updates: { completed: !item.completed },
    });
  };

  const handleStartEditItem = (item: GiftItem) => {
    setEditingItemId(item.id);
    setEditedItemText(item.text);
  };

  const handleUpdateItem = (itemId: string) => {
    if (editedItemText.trim()) {
      updateItemMutation.mutate({
        itemId,
        updates: { text: editedItemText },
      });
    }
  };

  const handleMoveUp = async (item: GiftItem, index: number) => {
    if (index === 0 || !items || updateItemMutation.isPending) return;
    
    const prevItem = items[index - 1];
    
    // Capture the order values we want to swap
    const itemTargetOrder = prevItem.order;  // item will get prevItem's order
    const prevItemTargetOrder = item.order;  // prevItem will get item's order
    
    // Optimistic update: swap positions with swapped order values
    const optimisticItems = [...items];
    [optimisticItems[index], optimisticItems[index - 1]] = [
      { ...prevItem, order: prevItemTargetOrder },  // prevItem moves down with item's order
      { ...item, order: itemTargetOrder }  // item moves up with prevItem's order
    ];
    queryClient.setQueryData(["/api/gift-lists", id, "items"], optimisticItems);
    
    try {
      await updateItemMutation.mutateAsync({
        itemId: item.id,
        updates: { order: itemTargetOrder },
      });
      await updateItemMutation.mutateAsync({
        itemId: prevItem.id,
        updates: { order: prevItemTargetOrder },
      });
    } catch (error) {
      console.error("Failed to reorder items:", error);
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists", id, "items"] });
    }
  };

  const handleMoveDown = async (item: GiftItem, index: number) => {
    if (!items || index === items.length - 1 || updateItemMutation.isPending) return;
    
    const nextItem = items[index + 1];
    
    // Capture the order values we want to swap
    const itemTargetOrder = nextItem.order;  // item will get nextItem's order
    const nextItemTargetOrder = item.order;  // nextItem will get item's order
    
    // Optimistic update: swap positions with swapped order values
    const optimisticItems = [...items];
    [optimisticItems[index], optimisticItems[index + 1]] = [
      { ...nextItem, order: nextItemTargetOrder },  // nextItem moves up with item's order
      { ...item, order: itemTargetOrder }  // item moves down with nextItem's order
    ];
    queryClient.setQueryData(["/api/gift-lists", id, "items"], optimisticItems);
    
    try {
      await updateItemMutation.mutateAsync({
        itemId: item.id,
        updates: { order: itemTargetOrder },
      });
      await updateItemMutation.mutateAsync({
        itemId: nextItem.id,
        updates: { order: nextItemTargetOrder },
      });
    } catch (error) {
      console.error("Failed to reorder items:", error);
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists", id, "items"] });
    }
  };

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-muted-foreground">Please sign in to view this list</p>
      </div>
    );
  }

  if (listLoading || itemsLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-muted-foreground">List not found</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Button
        variant="ghost"
        onClick={() => setLocation("/gift-lists")}
        className="mb-4"
        data-testid="button-back-to-lists"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Lists
      </Button>

      <Card className="mb-6">
        <CardHeader>
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdateTitle();
                  } else if (e.key === "Escape") {
                    setEditingTitle(false);
                  }
                }}
                maxLength={200}
                autoFocus
                data-testid="input-edit-title"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleUpdateTitle}
                disabled={updateTitleMutation.isPending}
                data-testid="button-save-title"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditingTitle(false)}
                data-testid="button-cancel-edit-title"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-2xl" data-testid="text-list-title">
                {list.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingTitle(true);
                  setEditedTitle(list.title);
                }}
                data-testid="button-edit-title"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add a gift idea..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddItem();
                }
              }}
              maxLength={500}
              data-testid="input-new-item"
            />
            <Button
              onClick={handleAddItem}
              disabled={!newItemText.trim() || createItemMutation.isPending}
              data-testid="button-add-item"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {items && items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item: GiftItem, index: number) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-md hover-elevate"
                  data-testid={`item-row-${item.id}`}
                >
                  <div className="flex flex-col">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleMoveUp(item, index)}
                      disabled={index === 0 || updateItemMutation.isPending}
                      className="h-6 w-6 p-0"
                      data-testid={`button-move-up-${item.id}`}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleMoveDown(item, index)}
                      disabled={index === items.length - 1 || updateItemMutation.isPending}
                      className="h-6 w-6 p-0"
                      data-testid={`button-move-down-${item.id}`}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => handleToggleCompleted(item)}
                    data-testid={`checkbox-item-${item.id}`}
                  />
                  {editingItemId === item.id ? (
                    <>
                      <Input
                        value={editedItemText}
                        onChange={(e) => setEditedItemText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdateItem(item.id);
                          } else if (e.key === "Escape") {
                            setEditingItemId(null);
                          }
                        }}
                        maxLength={500}
                        className="flex-1"
                        autoFocus
                        data-testid={`input-edit-item-${item.id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleUpdateItem(item.id)}
                        disabled={updateItemMutation.isPending}
                        data-testid={`button-save-item-${item.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingItemId(null)}
                        data-testid={`button-cancel-edit-item-${item.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`flex-1 cursor-pointer ${item.completed ? "line-through text-muted-foreground" : ""}`}
                        onClick={() => handleStartEditItem(item)}
                        data-testid={`text-item-${item.id}`}
                      >
                        {item.text}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleStartEditItem(item)}
                        data-testid={`button-edit-item-${item.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Delete this item?")) {
                            deleteItemMutation.mutate(item.id);
                          }
                        }}
                        data-testid={`button-delete-item-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No items yet. Add your first gift idea above!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
