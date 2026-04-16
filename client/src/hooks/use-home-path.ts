import { useAuth } from "@/hooks/use-auth";
import { homePathForRole } from "@/lib/homeRoutes";

/** Logo / “home” link: `/` when signed out, role dashboard when signed in. */
export function useHomePath(): string {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return "/";
  if (user.role === "child" && user.childId != null) {
    return `/child/${user.childId}`;
  }
  return homePathForRole(user.role);
}
