import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { homePathForRole } from "@/lib/homeRoutes";

/** `/child` sends signed-in child users to their play space; others go to their home route. */
export default function ChildEntryRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect to="/" />;
  }

  if (user.role === "child" && user.childId != null) {
    return <Redirect to={`/child/${user.childId}`} replace />;
  }

  return <Redirect to={homePathForRole(user.role)} replace />;
}
