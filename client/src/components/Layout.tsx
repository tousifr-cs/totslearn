import { ReactNode } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useHomePath } from "@/hooks/use-home-path";
import { LogOut, Settings, LayoutDashboard } from "lucide-react";
import type { AppRole } from "@shared/models/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/BrandMark";

function roleLabel(role: AppRole | undefined): string | null {
  if (!role) return null;
  const labels: Record<AppRole, string> = {
    parent: "Parent",
    admin: "Admin",
    child: "Child",
  };
  return labels[role];
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const homePath = useHomePath();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={homePath} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <BrandMark />
            <span className="font-display text-2xl font-bold tracking-wide">TotsLearn</span>
          </Link>

          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href={homePath} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 hidden md:flex">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 hidden md:flex">
                    <Settings className="w-4 h-4" /> Content admin
                  </Link>
                )}
                
                <div className="h-6 w-px bg-border mx-2 hidden md:block" />
                
                <div className="flex items-center gap-2">
                  {roleLabel(user?.role) && (
                    <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md">
                      {roleLabel(user?.role)}
                    </span>
                  )}
                  <span className="text-sm font-medium hidden sm:block">
                    {user?.firstName || user?.email || "User"}
                  </span>
                  <ThemeToggle />
                  <Button variant="ghost" size="icon" onClick={() => logout()} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </>
            ) : (
              <a href="/api/login" className="px-6 py-2.5 rounded-full font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                Sign In
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
