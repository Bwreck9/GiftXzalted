// Replit Auth hook - referenced from javascript_log_in_with_replit blueprint
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  const isAuthenticated = !!user;
  
  console.log('[useAuth] isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  return {
    user: user || undefined,
    isLoading,
    isAuthenticated,
  };
}
