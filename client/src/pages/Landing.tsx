import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import {
  Play,
  Sparkles,
  Shield,
  Trophy,
  Users,
  Baby,
  ShieldCheck,
  BookOpen,
  Puzzle,
  Palette,
  LayoutDashboard,
  LineChart,
  HeartHandshake,
  CheckCircle2,
  Star,
  Quote,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHomePath } from "@/hooks/use-home-path";
import { homePathForRole } from "@/lib/homeRoutes";
import type { AppRole } from "@shared/models/auth";

async function fetchDemoMode(): Promise<{ enabled: boolean }> {
  const res = await fetch("/api/auth/demo-mode");
  if (!res.ok) return { enabled: false };
  return res.json();
}

const programs = [
  {
    title: "Stories & language",
    description: "Rhymes, read-alouds, and vocabulary in short sessions that fit young attention spans.",
    icon: BookOpen,
  },
  {
    title: "Numbers & patterns",
    description: "Early math through games—counting, sorting, and gentle progression as skills grow.",
    icon: Puzzle,
  },
  {
    title: "Creative play",
    description: "Drawing, music, and open-ended activities that build confidence and motor skills.",
    icon: Palette,
  },
  {
    title: "Family & classroom hub",
    description: "Parents and admins see progress in one place, with roles tailored to how you support learners.",
    icon: LayoutDashboard,
  },
];

const platformPillars = [
  {
    n: "01",
    title: "Learning that feels like play",
    body: "Short, joyful modules keep children engaged while building early literacy, numeracy, and social skills.",
  },
  {
    n: "02",
    title: "Support for every adult in the loop",
    body: "Clear dashboards for parents—assignments, milestones, and calm visibility without overwhelm.",
  },
  {
    n: "03",
    title: "A calm, ad-free space",
    body: "No third-party ads. Content and pacing designed for preschoolers, with safety and privacy in mind.",
  },
];

const steps = [
  {
    title: "Personalize your path",
    body: "Set age and goals so activities match your child’s stage—home practice or classroom use.",
  },
  {
    title: "Learn and track progress",
    body: "Practice daily, celebrate small wins, and see skills develop over time in the dashboard.",
  },
  {
    title: "Share and celebrate",
    body: "Families and admins stay aligned with simple reports you can actually use in conversations.",
  },
];

const testimonials = [
  {
    quote:
      "We finally have one place for songs and number games that isn’t a noisy video app. My four-year-old asks for it.",
    name: "Elena M.",
    role: "Parent",
  },
  {
    quote:
      "My kid actually asks to open the app—the activities feel like games, not homework.",
    name: "Jordan K.",
    role: "Parent",
  },
];

export default function Landing() {
  const { demoLogin, isDemoLoggingIn, isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const dashboardPath = useHomePath();
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const { data: demoMode } = useQuery({
    queryKey: ["/api/auth/demo-mode"],
    queryFn: fetchDemoMode,
    staleTime: Infinity,
  });

  const tryDemo = async (role: AppRole, password?: string) => {
    await demoLogin(role, password);
    setLocation(homePathForRole(role));
  };

  const openAdminDemo = () => {
    setAdminPassword("");
    setAdminError(null);
    setAdminOpen(true);
  };

  const submitAdminDemo = async (e: FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    try {
      await tryDemo("admin", adminPassword);
      setAdminOpen(false);
      setAdminPassword("");
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Sign-in failed");
    }
  };

  const DemoActions = () =>
    demoMode?.enabled ? (
      <>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Try the app locally</p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Button
            type="button"
            size="lg"
            className="rounded-full font-bold text-base gap-2 shadow-md shadow-primary/15"
            disabled={isDemoLoggingIn}
            onClick={() => tryDemo("parent")}
          >
            <Users className="w-5 h-5" />
            Parent
          </Button>
          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="rounded-full font-bold text-base gap-2"
            disabled={isDemoLoggingIn}
            onClick={() => tryDemo("child")}
          >
            <Baby className="w-5 h-5" />
            Child
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="rounded-full font-bold text-base gap-2 border-2 border-border bg-card/80"
            disabled={isDemoLoggingIn}
            onClick={openAdminDemo}
          >
            <ShieldCheck className="w-5 h-5" />
            Admin
          </Button>
        </div>
        <p className="text-xs text-muted-foreground max-w-md">
          Each role opens a different home screen. Use the header to sign out.
        </p>
      </>
    ) : (
      <a
        href="/api/login"
        className="px-8 py-4 rounded-full font-bold text-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:bg-primary/90 hover:-translate-y-0.5 transition-all text-center flex items-center justify-center gap-2 w-fit"
      >
        Get started <Play className="w-5 h-5 fill-current" />
      </a>
    );

  return (
    <Layout>
      <>
      <Dialog
        open={adminOpen}
        onOpenChange={(open) => {
          setAdminOpen(open);
          if (!open) {
            setAdminPassword("");
            setAdminError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitAdminDemo}>
            <DialogHeader>
              <DialogTitle>Admin demo access</DialogTitle>
              <DialogDescription>
                Enter the admin demo password to continue.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label htmlFor="admin-demo-password">Password</Label>
              <Input
                id="admin-demo-password"
                type="password"
                autoComplete="current-password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                disabled={isDemoLoggingIn}
              />
              {adminError ? (
                <p className="text-sm text-destructive" role="alert">
                  {adminError}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdminOpen(false)}
                disabled={isDemoLoggingIn}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isDemoLoggingIn}>
                {isDemoLoggingIn ? "Signing in…" : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-20 lg:gap-28 pb-16">
        {isAuthenticated && user && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-border/80 bg-card/90 px-4 py-3 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.firstName || user.email}</span>
            </p>
            <Link
              href={dashboardPath}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/15 transition-colors hover:bg-primary/90 w-fit"
            >
              <LayoutDashboard className="h-4 w-4" />
              Open your dashboard
            </Link>
          </div>
        )}

        {/* Hero */}
        <section className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 pt-4 lg:pt-10">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 text-primary border border-primary/15 font-semibold text-sm">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Early learning, thoughtfully designed</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.08] text-foreground">
              Where early learning feels like{" "}
              <span className="text-primary">playtime</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              A calm, ad-free place for young children to explore—with parents and admins supporting the journey.
            </p>
            <div className="flex flex-col gap-4 pt-2">
              {isAuthenticated ? (
                <Link
                  href={dashboardPath}
                  className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:bg-primary/90"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Go to your dashboard
                </Link>
              ) : (
                <DemoActions />
              )}
            </div>
          </div>

          <div className="flex-1 relative w-full max-w-lg mx-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/12 via-transparent to-accent/10 blob-shape -z-10 transform scale-110" />
            <img
              src="https://images.unsplash.com/photo-1587691592099-24045742c181?auto=format&fit=crop&q=80&w=1000"
              alt="Children learning playfully"
              className="rounded-3xl shadow-2xl border-[6px] border-card object-cover aspect-square"
            />
            <div className="absolute -bottom-5 -left-4 sm:-left-6 bg-card p-4 rounded-2xl shadow-lg border border-border/80 flex items-center gap-4 animate-float-soft">
              <div className="p-3 bg-secondary rounded-full text-secondary-foreground">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Playful progress</p>
                <p className="text-xs text-muted-foreground">Rewards that motivate</p>
              </div>
            </div>
            <div className="absolute -top-5 -right-4 sm:-right-6 bg-card p-4 rounded-2xl shadow-lg border border-border/80 flex items-center gap-4 animate-float-soft-delayed">
              <div className="p-3 bg-secondary rounded-full text-secondary-foreground">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Parent controlled</p>
                <p className="text-xs text-muted-foreground">Built for trust</p>
              </div>
            </div>
          </div>
        </section>

        {/* Programs */}
        <section className="space-y-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Programs</p>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground">Ways to learn with TotsLearn</h2>
            <p className="text-muted-foreground text-lg">
              Pick a focus or mix them—each path is built for short sessions and growing confidence.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5 lg:gap-6">
            {programs.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="border-border/80 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-display">{title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Platform pillars */}
        <section className="rounded-[2rem] bg-muted/60 border border-border/60 p-8 md:p-12 lg:p-14 space-y-10">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Why families choose us</p>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground">A smarter home for early learning</h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to practice, guide, and celebrate—without the clutter of generic apps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 md:gap-8">
            {platformPillars.map(({ n, title, body }) => (
              <div key={n} className="space-y-4">
                <span className="font-display text-5xl text-primary/25 tabular-nums">{n}</span>
                <h3 className="font-display text-xl text-foreground">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="space-y-10">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</p>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground">Three simple steps</h2>
            <p className="text-muted-foreground text-lg">From setup to progress you can talk about at dinner.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="relative flex gap-4 md:flex-col md:gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold text-sm">
                  {i + 1}
                </div>
                <div className="space-y-2 pt-0.5 md:pt-0">
                  <h3 className="font-display text-lg text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Social proof */}
        <section className="space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Community</p>
              <h2 className="font-display text-3xl sm:text-4xl text-foreground">Loved by families and educators</h2>
              <p className="text-muted-foreground text-lg">
                Real feedback from people who want calm, effective tools—not another noisy screen.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 lg:gap-10 text-sm">
              <div>
                <p className="font-display text-3xl text-foreground">Ages 3–6</p>
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 fill-accent text-accent shrink-0" />
                  focused activities
                </p>
              </div>
              <div>
                <p className="font-display text-3xl text-foreground">Under 15 min</p>
                <p className="text-muted-foreground">typical session length</p>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/80 bg-card/90">
                <CardContent className="pt-8 pb-6 px-6">
                  <Quote className="w-8 h-8 text-primary/20 mb-3" aria-hidden />
                  <p className="text-foreground leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">{t.name}</span>
                    <span className="text-muted-foreground">· {t.role}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trust strip */}
        <section className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-8 md:px-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-3">
              <HeartHandshake className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-lg text-foreground">Designed with educators</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Pedagogy-first content, COPPA-minded defaults, and room to grow with your school or home.
                </p>
              </div>
            </div>
            <ul className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                No third-party ads
              </li>
              <li className="flex items-center gap-2">
                <LineChart className="w-4 h-4 text-primary shrink-0" />
                Progress you can track
              </li>
            </ul>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="rounded-[2rem] bg-primary text-primary-foreground px-8 py-12 md:px-12 md:py-14 text-center space-y-6 shadow-lg shadow-primary/20">
          <h2 className="font-display text-3xl sm:text-4xl max-w-2xl mx-auto">
            Learning that fits real life—at home or in the classroom
          </h2>
          <p className="text-primary-foreground/85 max-w-xl mx-auto text-lg">
            {isAuthenticated
              ? "Your dashboard is one tap away—or use the browser back button from there to return to this page."
              : "Sign in to continue your journey, or try a demo role if you're running the app locally."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {isAuthenticated ? (
              <Link
                href={dashboardPath}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold bg-primary-foreground text-primary hover:opacity-95 transition-opacity shadow-md"
              >
                <LayoutDashboard className="h-5 w-5" />
                Open dashboard
              </Link>
            ) : (
              <>
                <a
                  href="/api/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold bg-primary-foreground text-primary hover:opacity-95 transition-opacity shadow-md"
                >
                  Sign in
                </a>
                {demoMode?.enabled && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="rounded-full font-bold bg-primary-foreground/15 text-primary-foreground border-0 hover:bg-primary-foreground/25"
                    disabled={isDemoLoggingIn}
                    onClick={() => tryDemo("parent")}
                  >
                    Quick demo (parent)
                  </Button>
                )}
              </>
            )}
          </div>
        </section>
      </div>
      </>
    </Layout>
  );
}
