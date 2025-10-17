import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

async function fetchUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/user", {
      credentials: "include",
    });
    
    if (res.status === 401) {
      return null;
    }
    
    if (!res.ok) {
      throw new Error(`Failed to fetch user: ${res.status}`);
    }
    
    const user = await res.json();
    return user;
  } catch (error) {
    console.error('[useAuth] Error fetching user:', error);
    return null;
  }
}

export function useAuth() {
  const { data: user = null, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  const isAuthenticated = user !== null;

  return {
    user: user ?? undefined,
    isLoading,
    isAuthenticated,
  };
}
