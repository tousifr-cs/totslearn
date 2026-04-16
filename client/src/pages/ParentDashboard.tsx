import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useChildren, useCreateChild } from "@/hooks/use-children";
import { useParentAnalytics, type ParentAnalytics } from "@/hooks/use-analytics";
import { Redirect, Link } from "wouter";
import { homePathForRole } from "@/lib/homeRoutes";
import { Plus, Settings, PlayCircle, Clock, Star, Users, BookOpen, Target, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const childFormSchema = api.children.create.input.extend({
  age: z.coerce.number().min(1).max(12),
  screenTimeLimit: z.coerce.number().min(10).max(300)
});

const CHILD_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];
const PIE_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6"];

const MODULE_TYPE_LABELS: Record<string, string> = {
  video: "Videos",
  game: "Games",
  story: "Stories",
  drawing: "Drawing",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatCard({ icon: Icon, label, value, sublabel, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSection({ analytics }: { analytics: ParentAnalytics }) {
  const { overallStats, weeklyActivity, children: childAnalytics } = analytics;
  const [selectedChild, setSelectedChild] = useState<string>("all");

  const weeklyChartConfig: ChartConfig = {
    completions: { label: "Completions", color: "#6366f1" },
    totalScore: { label: "Score", color: "#10b981" },
  };

  const weeklyData = weeklyActivity.map(w => ({
    ...w,
    label: formatDate(w.date),
  }));

  const scoreComparisonData = childAnalytics.map((c, i) => ({
    name: c.childName,
    score: c.totalScore,
    average: c.averageScore,
    completed: c.modulesCompleted,
    fill: CHILD_COLORS[i % CHILD_COLORS.length],
  }));

  const scoreComparisonConfig: ChartConfig = childAnalytics.reduce((acc, c, i) => {
    acc[c.childName] = { label: c.childName, color: CHILD_COLORS[i % CHILD_COLORS.length] };
    return acc;
  }, {} as ChartConfig);

  const allTypeBreakdown = new Map<string, number>();
  childAnalytics.forEach(c => {
    c.moduleTypeBreakdown.forEach(t => {
      allTypeBreakdown.set(t.type, (allTypeBreakdown.get(t.type) || 0) + t.count);
    });
  });
  const pieData = Array.from(allTypeBreakdown.entries()).map(([type, count]) => ({
    name: MODULE_TYPE_LABELS[type] || type,
    value: count,
  }));

  const filteredChild = selectedChild !== "all"
    ? childAnalytics.find(c => String(c.childId) === selectedChild)
    : null;

  const recentScores = filteredChild
    ? filteredChild.recentScores
    : childAnalytics.flatMap(c =>
        c.recentScores.map(s => ({ ...s, childName: c.childName }))
      ).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Analytics
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">Track your children's learning progress</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Modules Completed" value={overallStats.totalModulesCompleted} color="bg-indigo-500" />
        <StatCard icon={Star} label="Total Points" value={overallStats.totalScore.toLocaleString()} color="bg-amber-500" />
        <StatCard icon={Target} label="Avg Score" value={overallStats.averageScore} sublabel="per module" color="bg-emerald-500" />
        <StatCard icon={Users} label="Active Learners" value={overallStats.activeChildren} sublabel={`of ${childAnalytics.length}`} color="bg-pink-500" />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scores">Score Details</TabsTrigger>
          <TabsTrigger value="breakdown">Activity Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Weekly Activity</CardTitle>
                <CardDescription>Modules completed over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {weeklyData.some(d => d.completions > 0) ? (
                  <ChartContainer config={weeklyChartConfig} className="h-[220px] w-full">
                    <BarChart data={weeklyData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="completions" fill="var(--color-completions)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                    No activity this week yet
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Score Comparison</CardTitle>
                <CardDescription>Total learning scores by child</CardDescription>
              </CardHeader>
              <CardContent>
                {scoreComparisonData.length > 0 && scoreComparisonData.some(d => d.score > 0) ? (
                  <ChartContainer config={scoreComparisonConfig} className="h-[220px] w-full">
                    <BarChart data={scoreComparisonData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {scoreComparisonData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                    No scores recorded yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scores" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">Recent Quiz & Module Scores</CardTitle>
                  <CardDescription>Latest scores from completed modules</CardDescription>
                </div>
                <select
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-sm focus:border-primary outline-none"
                >
                  <option value="all">All Children</option>
                  {childAnalytics.map(c => (
                    <option key={c.childId} value={String(c.childId)}>{c.childName}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {recentScores.length > 0 ? (
                <div className="space-y-2">
                  {recentScores.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                          s.score >= 15 ? "bg-emerald-500" : s.score >= 10 ? "bg-amber-500" : "bg-red-400"
                        }`}>
                          {s.score}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.moduleTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(s.date)}
                            {"childName" in s && <span> &middot; {(s as any).childName}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: 3 }, (_, j) => (
                          <Star
                            key={j}
                            className={`w-3.5 h-3.5 ${j < Math.ceil(s.score / 7) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No scores recorded yet. Have your children complete some modules!
                </div>
              )}
            </CardContent>
          </Card>

          {childAnalytics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {childAnalytics.map((child, i) => (
                <Card key={child.childId} className="border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold`} style={{ backgroundColor: CHILD_COLORS[i % CHILD_COLORS.length] }}>
                        {child.childName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{child.childName}</p>
                        <p className="text-xs text-muted-foreground">{child.modulesCompleted} modules completed</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/40 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold">{child.totalScore}</p>
                        <p className="text-xs text-muted-foreground">Total Points</p>
                      </div>
                      <div className="bg-muted/40 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold">{child.averageScore}</p>
                        <p className="text-xs text-muted-foreground">Avg Score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Activity by Type</CardTitle>
                <CardDescription>Distribution of completed module types</CardDescription>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <div className="h-[250px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    No activity data yet
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Modules per Child</CardTitle>
                <CardDescription>How many modules each child has completed</CardDescription>
              </CardHeader>
              <CardContent>
                {childAnalytics.some(c => c.modulesCompleted > 0) ? (
                  <div className="space-y-4 pt-2">
                    {childAnalytics.map((child, i) => {
                      const maxCompleted = Math.max(...childAnalytics.map(c => c.modulesCompleted), 1);
                      const pct = (child.modulesCompleted / maxCompleted) * 100;
                      return (
                        <div key={child.childId} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{child.childName}</span>
                            <span className="text-muted-foreground">{child.modulesCompleted} modules</span>
                          </div>
                          <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max(pct, 4)}%`,
                                backgroundColor: CHILD_COLORS[i % CHILD_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    No completions yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ParentDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: children, isLoading: childrenLoading } = useChildren();
  const { data: analytics, isLoading: analyticsLoading } = useParentAnalytics();
  const createChild = useCreateChild();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof childFormSchema>>({
    resolver: zodResolver(childFormSchema),
    defaultValues: {
      name: "",
      age: 4,
      level: "beginner",
      screenTimeLimit: 60,
      avatarColor: "blue"
    }
  });

  if (authLoading || childrenLoading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  if (user?.role && user.role !== "parent") {
    return <Redirect to={homePathForRole(user.role)} replace />;
  }

  const onSubmit = (data: z.infer<typeof childFormSchema>) => {
    createChild.mutate(data, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
      }
    });
  };

  const getAvatarColor = (color: string) => {
    const map: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      pink: 'bg-pink-500',
    };
    return map[color] || map.blue;
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Parent Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your children's profiles and progress</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add Child
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Add a Child Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Child's Name</label>
                  <input 
                    {...form.register("name")}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                    placeholder="e.g. Leo"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Age</label>
                    <input 
                      type="number"
                      {...form.register("age")}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Screen Time (min)</label>
                    <input 
                      type="number"
                      {...form.register("screenTimeLimit")}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Level</label>
                  <select 
                    {...form.register("level")}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Avatar Color</label>
                  <select 
                    {...form.register("avatarColor")}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                  >
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="purple">Purple</option>
                    <option value="orange">Orange</option>
                    <option value="pink">Pink</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={createChild.isPending}
                  className="w-full mt-4 px-4 py-3 rounded-xl font-bold bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-all"
                >
                  {createChild.isPending ? "Creating..." : "Create Profile"}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {children?.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border shadow-sm">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No children added yet</h3>
            <p className="text-muted-foreground mt-2 mb-6">Create a profile to start tracking their learning journey.</p>
            <button 
              onClick={() => setIsDialogOpen(true)}
              className="px-6 py-2.5 rounded-full font-semibold bg-primary text-primary-foreground shadow-md hover:-translate-y-0.5 transition-all"
            >
              Create First Profile
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children?.map(child => (
                <div key={child.id} className="bg-card rounded-3xl p-6 shadow-xl shadow-black/5 border border-border/50 hover:shadow-2xl hover:border-primary/20 transition-all duration-300 group flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-16 h-16 rounded-2xl ${getAvatarColor(child.avatarColor)} text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      <span className="font-display text-3xl font-bold">{child.name.charAt(0)}</span>
                    </div>
                    <button className="p-2 text-muted-foreground hover:text-primary transition-colors bg-muted rounded-full opacity-0 group-hover:opacity-100">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h3 className="font-display text-2xl font-bold text-foreground">{child.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 mb-6">
                    <span className="capitalize">{child.level}</span> &bull; <span>Age {child.age}</span>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Star className="w-4 h-4 text-secondary fill-secondary" /> Score</span>
                      <span className="font-bold">{child.learningScore} pts</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="w-4 h-4 text-blue-500" /> Screen Time</span>
                      <span className="font-bold">{child.screenTimeLimit} min</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <Link href={`/child/${child.id}`} className="w-full py-3 rounded-xl font-bold bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2">
                      <PlayCircle className="w-5 h-5" /> Launch Child View
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {analyticsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : analytics ? (
              <AnalyticsSection analytics={analytics} />
            ) : null}
          </>
        )}
      </div>
    </Layout>
  );
}
