import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useChildren, useCreateChild } from "@/hooks/use-children";
import { Redirect, Link } from "wouter";
import { Plus, Settings, PlayCircle, Clock, Star, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";

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

export default function ParentDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: children, isLoading: childrenLoading } = useChildren();
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
    return <Redirect to="/api/login" />;
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
      <div className="max-w-5xl mx-auto space-y-8">
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
                  <span className="capitalize">{child.level}</span> • <span>Age {child.age}</span>
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
        )}
      </div>
    </Layout>
  );
}
