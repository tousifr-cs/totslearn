import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useModules, useCreateModule } from "@/hooks/use-modules";
import { Redirect } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";
import { Plus, BookOpen, Video, Gamepad2, PenTool, Play } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const moduleSchema = api.modules.create.input.extend({
  difficultyLevel: z.coerce.number().min(1).max(5)
});

export default function AdminDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: modules, isLoading: modulesLoading } = useModules();
  const createModule = useCreateModule();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof moduleSchema>>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "video",
      difficultyLevel: 1,
      contentUrl: ""
    }
  });

  if (authLoading || modulesLoading) {
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

  const onSubmit = (data: z.infer<typeof moduleSchema>) => {
    createModule.mutate(data, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
      }
    });
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'game': return <Gamepad2 className="w-5 h-5" />;
      case 'story': return <BookOpen className="w-5 h-5" />;
      case 'drawing': return <PenTool className="w-5 h-5" />;
      default: return <Play className="w-5 h-5" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Content Administration</h1>
            <p className="text-muted-foreground mt-1">Manage global learning modules available to all children.</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                <Plus className="w-5 h-5" /> New Module
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Create Learning Module</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Title</label>
                  <input 
                    {...form.register("title")}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Description</label>
                  <textarea 
                    {...form.register("description")}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all resize-none h-24"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Type</label>
                    <select 
                      {...form.register("type")}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                    >
                      <option value="video">Video</option>
                      <option value="game">Interactive Game</option>
                      <option value="story">Storybook</option>
                      <option value="drawing">Drawing Canvas</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Difficulty (1-5)</label>
                    <input 
                      type="number"
                      {...form.register("difficultyLevel")}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Content URL (Optional)</label>
                  <input 
                    {...form.register("contentUrl")}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                    placeholder="https://"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={createModule.isPending}
                  className="w-full mt-6 px-4 py-3 rounded-xl font-bold bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-all"
                >
                  {createModule.isPending ? "Creating..." : "Publish Module"}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-muted-foreground text-sm font-semibold border-b border-border">
                <tr>
                  <th className="px-6 py-4">Module Details</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Difficulty</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {modules?.map(mod => (
                  <tr key={mod.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{mod.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-md">{mod.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/10 text-secondary-foreground text-xs font-semibold capitalize">
                        {getIcon(mod.type)}
                        {mod.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {Array.from({length: 5}).map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i < mod.difficultyLevel ? 'bg-primary' : 'bg-muted'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-sm font-semibold text-primary hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
                {modules?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      No modules available. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
