import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AppRole, AuthUser } from "@shared/models/auth";

async function fetchUser(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  window.location.href = "/api/logout";
}

async function demoLogin(role: AppRole): Promise<AuthUser> {
  const response = await fetch("/api/auth/demo-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Demo login failed");
  }
  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  const demoLoginMutation = useMutation({
    mutationFn: demoLogin,
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    demoLogin: demoLoginMutation.mutateAsync,
    isDemoLoggingIn: demoLoginMutation.isPending,
  };
}
