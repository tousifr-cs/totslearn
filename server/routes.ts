import type { Express, RequestHandler } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import type { InsertModule } from "@shared/schema";
import type { AppRole } from "@shared/models/auth";
import { z } from "zod";

/** Replit users have no `role`; demo users do. */
function isParentUser(req: { user?: { role?: AppRole } }): boolean {
  const role = req.user?.role;
  if (role === undefined) return true;
  return role === "parent";
}

function canManageModules(req: { user?: { role?: AppRole } }): boolean {
  const role = req.user?.role;
  if (role === undefined) return true;
  return role === "admin";
}

const requireParent: RequestHandler = (req: any, res, next) => {
  if (!isParentUser(req)) {
    return res.status(403).json({ message: "Parent access required" });
  }
  next();
};

const requireModuleEditor: RequestHandler = (req: any, res, next) => {
  if (!canManageModules(req)) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

/** Ensured on startup so every environment has default child modules (by title). */
const DEFAULT_MODULES: InsertModule[] = [
  {
    title: "Learn the Alphabet",
    description: "Sing along and learn your ABCs with colorful letters!",
    type: "video",
    difficultyLevel: 1,
    contentUrl: "https://www.youtube.com/embed/75p-N9YKqNo",
  },
  {
    title: "Letter Sounds",
    description:
      "Hear how each letter sounds with simple words, then play a matching game for the first sound.",
    type: "game",
    difficultyLevel: 1,
  },
  {
    title: "Shape Matcher",
    description: "Drag the shapes to their matching friends!",
    type: "game",
    difficultyLevel: 1,
  },
  {
    title: "The Hungry Caterpillar",
    description: "Follow the caterpillar on his tasty journey.",
    type: "story",
    difficultyLevel: 2,
  },
  {
    title: "Draw a Cat",
    description: "Let's draw a fluffy cat together step-by-step!",
    type: "drawing",
    difficultyLevel: 1,
  },
  {
    title: "Memory Match",
    description: "Flip cards and find matching pairs!",
    type: "game",
    difficultyLevel: 1,
  },
  {
    title: "Count & Tap",
    description: "Tap along to count objects on the screen!",
    type: "game",
    difficultyLevel: 1,
  },
  {
    title: "Color Match",
    description: "Find the blob that matches the color name!",
    type: "game",
    difficultyLevel: 1,
  },
  {
    title: "Same or Different",
    description: "Pick the picture that matches the one above!",
    type: "game",
    difficultyLevel: 1,
  },
  {
    title: "Follow the Path",
    description: "Tap the dots in order along the path!",
    type: "game",
    difficultyLevel: 2,
  },
  {
    title: "Starting Sounds",
    description: "Which picture starts with the same sound?",
    type: "game",
    difficultyLevel: 2,
  },
  {
    title: "Hot or Cold",
    description: "Sort things that are hot or cold!",
    type: "game",
    difficultyLevel: 1,
  },
  {
    title: "Pattern Play",
    description: "What shape comes next in the pattern?",
    type: "game",
    difficultyLevel: 2,
  },
  {
    title: "Number Order",
    description: "Tap 1, 2, 3, 4, 5 in order!",
    type: "game",
    difficultyLevel: 1,
  },
  {
    title: "Loud or Quiet",
    description: "Listen to two beeps — which one was louder?",
    type: "audio",
    difficultyLevel: 1,
  },
  {
    title: "High or Low",
    description: "Listen to two beeps — which one sounded higher?",
    type: "audio",
    difficultyLevel: 1,
  },
];

const isReplit = !!process.env.REPL_ID;

const DEMO_PROFILES: Record<
  AppRole,
  { id: string; email: string; firstName: string; lastName: string; profileImageUrl: null }
> = {
  parent: {
    id: "demo-parent",
    email: "parent@demo.local",
    firstName: "Jordan",
    lastName: "Rivera",
    profileImageUrl: null,
  },
  admin: {
    id: "demo-admin",
    email: "admin@demo.local",
    firstName: "Riley",
    lastName: "OpsAdmin",
    profileImageUrl: null,
  },
  child: {
    id: "demo-child",
    email: "child@demo.local",
    firstName: "Alex",
    lastName: "Learner",
    profileImageUrl: null,
  },
};

/** Demo learner row under demo-parent; created on first child demo login or seed. */
async function ensureDemoLearnerChild(): Promise<string> {
  const parentId = DEMO_PROFILES.parent.id;
  const existing = await storage.getChildren(parentId);
  const found = existing.find((c) => c.name === "Demo Learner");
  if (found) return found.id;
  const created = await storage.createChild(parentId, {
    name: "Demo Learner",
    age: 5,
    level: "beginner",
    screenTimeLimit: 60,
    avatarColor: "blue",
  });
  return created.id;
}

async function assertCanAccessChildResource(req: any, childId: string): Promise<void> {
  const child = await storage.getChild(childId);
  if (!child) {
    const err = new Error("Child not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  const role = req.user?.role as AppRole | undefined;
  const userId = req.user?.claims?.sub as string;
  if (role === "child") {
    if (String(req.user?.childId) !== String(childId)) {
      const err = new Error("Unauthorized") as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }
    return;
  }
  if (role === undefined || role === "parent") {
    if (child.parentId !== userId) {
      const err = new Error("Unauthorized") as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }
    return;
  }
  const err = new Error("Forbidden") as Error & { statusCode: number };
  err.statusCode = 403;
  throw err;
}

function buildDemoPassportUser(role: AppRole, childId?: string) {
  const p = DEMO_PROFILES[role];
  const u: {
    claims: { sub: string };
    access_token: string;
    role: AppRole;
    childId?: string;
  } = {
    claims: { sub: p.id },
    access_token: "demo",
    role,
  };
  if (role === "child" && childId != null) {
    u.childId = childId;
  }
  return u;
}

function demoUserJson(role: AppRole, childId?: string) {
  const p = DEMO_PROFILES[role];
  const base = {
    id: p.id,
    email: p.email,
    firstName: p.firstName,
    lastName: p.lastName,
    profileImageUrl: p.profileImageUrl,
    role,
  };
  if (role === "child" && childId != null) {
    return { ...base, childId };
  }
  return base;
}

async function setupLocalAuth(app: Express) {
  const session = (await import("express-session")).default;
  const MemoryStore = (await import("memorystore")).default(session);
  const { authStorage } = await import("./replit_integrations/auth/storage");

  for (const role of ["parent", "admin", "child"] as const) {
    const p = DEMO_PROFILES[role];
    await authStorage.upsertUser({
      id: p.id,
      email: p.email,
      firstName: p.firstName,
      lastName: p.lastName,
      profileImageUrl: p.profileImageUrl,
    });
  }

  app.use(
    session({
      secret: "local-dev-secret",
      store: new MemoryStore({ checkPeriod: 86400000 }),
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
    })
  );

  app.use((req: any, _res, next) => {
    const du = req.session?.demoUser;
    if (du) {
      req.user = du;
      req.isAuthenticated = () => true;
    } else {
      req.isAuthenticated = () => false;
    }
    next();
  });

  app.get("/api/login", (_req, res) => res.redirect("/"));

  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) console.error("session destroy", err);
      res.redirect("/");
    });
  });

  app.get("/api/auth/user", (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const role = req.user.role as AppRole;
    const childId = req.user.childId as string | undefined;
    res.json(demoUserJson(role, childId));
  });

  const demoRoleSchema = z.enum(["parent", "admin", "child"]);
  const adminDemoPassword = process.env.ADMIN_DEMO_PASSWORD ?? "1234";

  app.post("/api/auth/demo-login", async (req, res) => {
    const parsed = demoRoleSchema.safeParse(req.body?.role);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const role = parsed.data;
    if (role === "admin") {
      const password = req.body?.password;
      if (typeof password !== "string" || password !== adminDemoPassword) {
        return res.status(401).json({ message: "Invalid admin password" });
      }
    }
    let childId: string | undefined;
    if (role === "child") {
      try {
        childId = await ensureDemoLearnerChild();
      } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Failed to prepare demo child profile" });
      }
    }
    req.session.demoUser = buildDemoPassportUser(role, childId);
    req.session.save((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Session error" });
      }
      res.json(demoUserJson(role, childId));
    });
  });
}

const localIsAuthenticated: RequestHandler = (req, res, next) => {
  if (!(req as any).isAuthenticated?.()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  let isAuthenticated: RequestHandler;

  if (isReplit) {
    const auth = await import("./replit_integrations/auth");
    await auth.setupAuth(app);
    auth.registerAuthRoutes(app);
    isAuthenticated = auth.isAuthenticated;
  } else {
    await setupLocalAuth(app);
    isAuthenticated = localIsAuthenticated;
  }

  app.get("/api/auth/demo-mode", (_req, res) => {
    res.json({ enabled: !isReplit });
  });

  // CHILDREN ROUTES
  app.get(api.children.list.path, isAuthenticated, requireParent, async (req: any, res) => {
    const userId = req.user.claims.sub;
    try {
      const parentChildren = await storage.getChildren(userId);
      res.json(parentChildren);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.post(api.children.create.path, isAuthenticated, requireParent, async (req: any, res) => {
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
    try {
      const childId = req.params.id;
      await assertCanAccessChildResource(req, childId);
      const child = await storage.getChild(childId);
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }
      res.json(child);
    } catch (e: unknown) {
      const err = e as Error & { statusCode?: number };
      const code = err.statusCode ?? 500;
      if (code === 404) {
        return res.status(404).json({ message: "Child not found" });
      }
      return res.status(code).json({ message: err.message ?? "Failed to fetch child" });
    }
  });

  app.put(api.children.update.path, isAuthenticated, requireParent, async (req: any, res) => {
    const userId = req.user.claims.sub;
    try {
      const child = await storage.getChild(req.params.id);
      if (!child) {
        return res.status(404).json({ message: 'Child not found' });
      }
      if (child.parentId !== userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const input = api.children.update.input.parse(req.body);
      const updatedChild = await storage.updateChild(req.params.id, input);
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
    try {
      const childId = req.params.id;
      await assertCanAccessChildResource(req, childId);
      const child = await storage.getChild(childId);
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }

      const recentProgress = await storage.getRecentProgress(childId);
      const recommendedModules = await storage.getModules();

      res.json({
        child,
        recentProgress,
        activeChallenges: [],
        recommendedModules: recommendedModules.slice(0, 4),
      });
    } catch (e: unknown) {
      const err = e as Error & { statusCode?: number };
      const code = err.statusCode ?? 500;
      if (code === 404) {
        return res.status(404).json({ message: "Child not found" });
      }
      return res.status(code).json({ message: err.message ?? "Failed to fetch dashboard data" });
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
      const mod = await storage.getModule(req.params.id);
      if (!mod) {
        return res.status(404).json({ message: 'Module not found' });
      }
      res.json(mod);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch module" });
    }
  });

  app.post(api.modules.create.path, isAuthenticated, requireModuleEditor, async (req, res) => {
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
    try {
      const input = api.progress.record.input.parse(req.body);
      await assertCanAccessChildResource(req, input.childId);
      const newProgress = await storage.recordProgress(input.childId, input.moduleId, input.score);
      res.json(newProgress);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const e = err as Error & { statusCode?: number };
      const code = e.statusCode ?? 500;
      return res.status(code).json({ message: e.message ?? "Failed to record progress" });
    }
  });

  // ANALYTICS ROUTES
  app.get(api.analytics.parent.path, isAuthenticated, requireParent, async (req: any, res) => {
    const userId = req.user.claims.sub;
    try {
      const analytics = await storage.getParentAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getModules();
  const titles = new Set(existing.map((m) => m.title));
  for (const mod of DEFAULT_MODULES) {
    if (!titles.has(mod.title)) {
      await storage.createModule(mod);
      titles.add(mod.title);
    }
  }
  if (!isReplit) {
    try {
      await ensureDemoLearnerChild();
    } catch (e) {
      console.error("ensureDemoLearnerChild", e);
    }
  }
}
