import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Play, Sparkles, Shield, Trophy } from "lucide-react";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row items-center gap-12 py-12 lg:py-24">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>The #1 Preschool Learning Platform</span>
          </div>
          <h1 className="font-display text-5xl lg:text-7xl font-bold leading-tight text-foreground">
            Where early learning feels like <span className="text-primary">playtime.</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            A safe, ad-free environment where your little ones can explore, create, and grow through interactive modules designed by early education experts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <a 
              href="/api/login" 
              className="px-8 py-4 rounded-full font-bold text-lg bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-2xl hover:bg-primary/90 hover:-translate-y-1 transition-all text-center flex items-center justify-center gap-2"
            >
              Get Started Free <Play className="w-5 h-5 fill-current" />
            </a>
          </div>
        </div>

        <div className="flex-1 relative w-full max-w-lg mx-auto">
          {/* Decorative background blob */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 blob-shape -z-10 transform scale-110"></div>
          
          {/* landing page hero children playing and learning colorful */}
          <img 
            src="https://images.unsplash.com/photo-1587691592099-24045742c181?auto=format&fit=crop&q=80&w=1000" 
            alt="Children learning playfully" 
            className="rounded-3xl shadow-2xl border-8 border-white/50 backdrop-blur-sm object-cover aspect-square"
          />

          {/* Floating badges */}
          <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
            <div className="p-3 bg-secondary/20 rounded-full text-secondary-foreground">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Gamified</p>
              <p className="text-xs text-muted-foreground">Learning</p>
            </div>
          </div>

          <div className="absolute -top-6 -right-6 bg-card p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
            <div className="p-3 bg-green-500/20 rounded-full text-green-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">100% Safe</p>
              <p className="text-xs text-muted-foreground">Parent Controlled</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
