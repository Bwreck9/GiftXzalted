import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

async function fetchUser(): Promise<User | null> {
  const res = await fetch("/api/auth/user", {
    credentials: "include",
  });
  
  if (res.status === 401) {
    return null;
  }
  
  if (!res.ok) {
    return null;
  }
  
  const user = await res.json();
  return user;
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
