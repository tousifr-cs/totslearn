import { ReactNode } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useHomePath } from "@/hooks/use-home-path";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, LayoutDashboard } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const homePath = useHomePath();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto h-16 px-4 flex items-center justify-between">
          <Link href={homePath} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <BrandMark className="h-9 w-9" />
            <span className="font-outfit font-bold text-xl tracking-tight hidden sm:inline-block text-slate-800">
              TotsLearn
            </span>
          </Link>

          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 mr-4 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="Avatar" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <span>{user.firstName || user.email}</span>
              </div>

              <Link href={homePath} className="text-slate-600 hover:text-primary transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/5">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <Link href="/admin" className="text-slate-600 hover:text-primary transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/5">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logout()}
                className="text-slate-500 hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </div>
          )}
          {!user && (
            <Button asChild className="rounded-full shadow-md shadow-primary/20">
              <a href="/api/login">Log In</a>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
