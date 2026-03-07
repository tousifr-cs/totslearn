import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Set up authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // CHILDREN ROUTES
  app.get(api.children.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    try {
      const parentChildren = await storage.getChildren(userId);
      res.json(parentChildren);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.post(api.children.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    try {
      const input = api.children.create.input.parse(req.body);
      const child = await storage.createChild(userId, input);
      res.status(201).json(child);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create child" });
    }
  });

  app.get(api.children.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    try {
      const child = await storage.getChild(Number(req.params.id));
      if (!child) {
        return res.status(404).json({ message: 'Child not found' });
      }
      // Ensure the child belongs to the logged-in parent
      if (child.parentId !== userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      res.json(child);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch child" });
    }
  });

  app.put(api.children.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    try {
      const child = await storage.getChild(Number(req.params.id));
      if (!child) {
        return res.status(404).json({ message: 'Child not found' });
      }
      if (child.parentId !== userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const input = api.children.update.input.parse(req.body);
      const updatedChild = await storage.updateChild(Number(req.params.id), input);
      res.json(updatedChild);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to update child" });
    }
  });

  app.get(api.children.getDashboard.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    try {
      const childId = Number(req.params.id);
      const child = await storage.getChild(childId);
      
      if (!child) {
        return res.status(404).json({ message: 'Child not found' });
      }
      if (child.parentId !== userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const recentProgress = await storage.getRecentProgress(childId);
      const recommendedModules = await storage.getModules(); // Simple mock for now

      res.json({
        child,
        recentProgress,
        activeChallenges: [], // Future enhancement
        recommendedModules: recommendedModules.slice(0, 4),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });


  // MODULES ROUTES
  app.get(api.modules.list.path, async (req, res) => {
    try {
      const allModules = await storage.getModules();
      res.json(allModules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.get(api.modules.get.path, async (req, res) => {
    try {
      const mod = await storage.getModule(Number(req.params.id));
      if (!mod) {
        return res.status(404).json({ message: 'Module not found' });
      }
      res.json(mod);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch module" });
    }
  });

  app.post(api.modules.create.path, isAuthenticated, async (req, res) => {
    // Ideally we would check for an admin role here. 
    try {
      const input = api.modules.create.input.parse(req.body);
      const mod = await storage.createModule(input);
      res.status(201).json(mod);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create module" });
    }
  });


  // PROGRESS ROUTES
  app.post(api.progress.record.path, isAuthenticated, async (req: any, res) => {
      const userId = req.user.claims.sub;
      try {
        const input = api.progress.record.input.parse(req.body);
        
        // Ensure parent owns the child
        const child = await storage.getChild(input.childId);
        if (!child || child.parentId !== userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const newProgress = await storage.recordProgress(input.childId, input.moduleId, input.score);
        res.json(newProgress);
      } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
              message: err.errors[0].message,
              field: err.errors[0].path.join('.'),
            });
          }
          res.status(500).json({ message: "Failed to record progress" });
      }
  })


  // Seed initial data if needed
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const existingModules = await storage.getModules();
  if (existingModules.length === 0) {
    await storage.createModule({
      title: "Learn the Alphabet",
      description: "Sing along and learn your ABCs with colorful letters!",
      type: "video",
      difficultyLevel: 1,
      contentUrl: "https://www.youtube.com/embed/75p-N9YKqNo"
    });
    
    await storage.createModule({
      title: "Shape Matcher",
      description: "Drag the shapes to their matching friends!",
      type: "game",
      difficultyLevel: 1,
    });
    
    await storage.createModule({
      title: "The Hungry Caterpillar",
      description: "Follow the caterpillar on his tasty journey.",
      type: "story",
      difficultyLevel: 2,
    });

    await storage.createModule({
      title: "Draw a Cat",
      description: "Let's draw a fluffy cat together step-by-step!",
      type: "drawing",
      difficultyLevel: 1,
    });
  }
}
