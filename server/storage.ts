import { db } from "./db";
import { eq, desc, inArray } from "drizzle-orm";
import {
  children,
  modules,
  progress,
  type Child,
  type InsertChild,
  type UpdateChild,
  type Module,
  type InsertModule,
  type Progress,
} from "@shared/schema";

export interface ChildAnalytics {
  childId: number;
  childName: string;
  avatarColor: string;
  totalScore: number;
  modulesCompleted: number;
  averageScore: number;
  recentScores: { date: string; score: number; moduleTitle: string }[];
  moduleTypeBreakdown: { type: string; count: number }[];
}

export interface ParentAnalytics {
  children: ChildAnalytics[];
  overallStats: {
    totalModulesCompleted: number;
    totalScore: number;
    averageScore: number;
    activeChildren: number;
  };
  weeklyActivity: { date: string; completions: number; totalScore: number }[];
}

// ── ABSTRACTION ─────────────────────────────────────────────────────
// The IStorage interface defines WHAT storage can do (method signatures)
// without specifying HOW. Any class implementing this contract is valid.

export interface IStorage {
  getChildren(parentId: string): Promise<Child[]>;
  getChild(id: number): Promise<Child | undefined>;
  createChild(parentId: string, child: Omit<InsertChild, "parentId">): Promise<Child>;
  updateChild(id: number, updates: UpdateChild): Promise<Child>;

  getModules(): Promise<Module[]>;
  getModule(id: number): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;

  recordProgress(childId: number, moduleId: number, score?: number): Promise<Progress>;
  getRecentProgress(childId: number): Promise<Progress[]>;

  getParentAnalytics(parentId: string): Promise<ParentAnalytics>;
}

// ── INHERITANCE + ENCAPSULATION ─────────────────────────────────────
// BaseStorage is an abstract class that implements IStorage.
// - `private errorPrefix` is accessible only inside BaseStorage itself.
// - `protected name` and `protected` methods are accessible to subclasses
//   but invisible to outside code.
// - `abstract` methods force every subclass to provide its own implementation.

export abstract class BaseStorage implements IStorage {
  private errorPrefix: string;

  constructor(protected readonly name: string) {
    this.errorPrefix = `[${name}]`;
  }

  protected formatError(operation: string, err: unknown): string {
    return `${this.errorPrefix} ${operation} failed: ${err}`;
  }

  protected buildWeeklyActivity(
    entries: { completedAt: Date | null; score: number | null }[],
  ): ParentAnalytics["weeklyActivity"] {
    const weeklyMap = new Map<string, { completions: number; totalScore: number }>();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      weeklyMap.set(d.toISOString().split("T")[0], { completions: 0, totalScore: 0 });
    }
    entries.forEach((p) => {
      if (!p.completedAt) return;
      const key = new Date(p.completedAt).toISOString().split("T")[0];
      if (weeklyMap.has(key)) {
        const entry = weeklyMap.get(key)!;
        entry.completions++;
        entry.totalScore += p.score ?? 0;
      }
    });
    return Array.from(weeklyMap.entries()).map(([date, data]) => ({ date, ...data }));
  }

  abstract getChildren(parentId: string): Promise<Child[]>;
  abstract getChild(id: number): Promise<Child | undefined>;
  abstract createChild(parentId: string, child: Omit<InsertChild, "parentId">): Promise<Child>;
  abstract updateChild(id: number, updates: UpdateChild): Promise<Child>;
  abstract getModules(): Promise<Module[]>;
  abstract getModule(id: number): Promise<Module | undefined>;
  abstract createModule(module: InsertModule): Promise<Module>;
  abstract recordProgress(childId: number, moduleId: number, score?: number): Promise<Progress>;
  abstract getRecentProgress(childId: number): Promise<Progress[]>;
  abstract getParentAnalytics(parentId: string): Promise<ParentAnalytics>;
}

// ── CLASS (DatabaseStorage) + ENCAPSULATION ─────────────────────────
// Concrete class backed by PostgreSQL via Drizzle ORM.
// The `db` dependency is a private property injected through the
// constructor — external code cannot access or replace it.

export class DatabaseStorage extends BaseStorage {
  private db: typeof db;

  constructor(database: typeof db) {
    super("DatabaseStorage");
    this.db = database;
  }

  async getChildren(parentId: string): Promise<Child[]> {
    return await this.db.select().from(children).where(eq(children.parentId, parentId));
  }

  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await this.db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async createChild(parentId: string, child: Omit<InsertChild, "parentId">): Promise<Child> {
    const [newChild] = await this.db
      .insert(children)
      .values({ ...child, parentId })
      .returning();
    return newChild;
  }

  async updateChild(id: number, updates: UpdateChild): Promise<Child> {
    const [updatedChild] = await this.db
      .update(children)
      .set(updates)
      .where(eq(children.id, id))
      .returning();
    return updatedChild;
  }

  async getModules(): Promise<Module[]> {
    return await this.db.select().from(modules);
  }

  async getModule(id: number): Promise<Module | undefined> {
    const [mod] = await this.db.select().from(modules).where(eq(modules.id, id));
    return mod;
  }

  async createModule(mod: InsertModule): Promise<Module> {
    const [newModule] = await this.db.insert(modules).values(mod).returning();
    return newModule;
  }

  async recordProgress(childId: number, moduleId: number, score?: number): Promise<Progress> {
    const [newProgress] = await this.db
      .insert(progress)
      .values({ childId, moduleId, completed: true, score: score || 0 })
      .returning();

    const pointsEarned = 10 + (score || 0);
    const child = await this.getChild(childId);
    if (child) {
      await this.updateChild(childId, { learningScore: child.learningScore + pointsEarned });
    }

    return newProgress;
  }

  async getRecentProgress(childId: number): Promise<Progress[]> {
    return await this.db
      .select()
      .from(progress)
      .where(eq(progress.childId, childId))
      .orderBy(desc(progress.completedAt))
      .limit(10);
  }

  async getParentAnalytics(parentId: string): Promise<ParentAnalytics> {
    const parentChildren = await this.getChildren(parentId);
    if (parentChildren.length === 0) {
      return {
        children: [],
        overallStats: { totalModulesCompleted: 0, totalScore: 0, averageScore: 0, activeChildren: 0 },
        weeklyActivity: [],
      };
    }

    const childIds = parentChildren.map((c) => c.id);
    const allProgress = await this.db
      .select({
        id: progress.id,
        childId: progress.childId,
        moduleId: progress.moduleId,
        completed: progress.completed,
        score: progress.score,
        completedAt: progress.completedAt,
        moduleTitle: modules.title,
        moduleType: modules.type,
      })
      .from(progress)
      .innerJoin(modules, eq(progress.moduleId, modules.id))
      .where(inArray(progress.childId, childIds))
      .orderBy(desc(progress.completedAt));

    const childAnalytics: ChildAnalytics[] = parentChildren.map((child) => {
      const childProgress = allProgress.filter((p) => p.childId === child.id);
      const scores = childProgress.map((p) => p.score ?? 0);
      const avgScore =
        scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      const typeMap = new Map<string, number>();
      childProgress.forEach((p) => {
        typeMap.set(p.moduleType, (typeMap.get(p.moduleType) || 0) + 1);
      });

      return {
        childId: child.id,
        childName: child.name,
        avatarColor: child.avatarColor,
        totalScore: child.learningScore,
        modulesCompleted: childProgress.length,
        averageScore: avgScore,
        recentScores: childProgress.slice(0, 10).map((p) => ({
          date: p.completedAt
            ? new Date(p.completedAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          score: p.score ?? 0,
          moduleTitle: p.moduleTitle,
        })),
        moduleTypeBreakdown: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
      };
    });

    const totalCompleted = allProgress.length;
    const allScores = allProgress.map((p) => p.score ?? 0);
    const totalScoreSum = allScores.reduce((a, b) => a + b, 0);
    const overallAvg = allScores.length > 0 ? Math.round(totalScoreSum / allScores.length) : 0;
    const activeChildren = childAnalytics.filter((c) => c.modulesCompleted > 0).length;

    return {
      children: childAnalytics,
      overallStats: {
        totalModulesCompleted: totalCompleted,
        totalScore: totalScoreSum,
        averageScore: overallAvg,
        activeChildren,
      },
      weeklyActivity: this.buildWeeklyActivity(allProgress),
    };
  }
}

// ── CLASS (InMemoryStorage) + INHERITANCE ───────────────────────────
// A second concrete class that extends BaseStorage using plain Maps.
// No database required — useful for testing or lightweight dev.
// Demonstrates that multiple classes can share a parent (inheritance)
// while each providing their own implementation of abstract methods.

export class InMemoryStorage extends BaseStorage {
  private childrenStore = new Map<number, Child>();
  private modulesStore = new Map<number, Module>();
  private progressStore = new Map<number, Progress>();
  private nextChildId = 1;
  private nextModuleId = 1;
  private nextProgressId = 1;

  constructor() {
    super("InMemoryStorage");
  }

  async getChildren(parentId: string): Promise<Child[]> {
    return Array.from(this.childrenStore.values()).filter((c) => c.parentId === parentId);
  }

  async getChild(id: number): Promise<Child | undefined> {
    return this.childrenStore.get(id);
  }

  async createChild(parentId: string, child: Omit<InsertChild, "parentId">): Promise<Child> {
    const newChild: Child = {
      id: this.nextChildId++,
      parentId,
      name: child.name,
      age: child.age,
      level: child.level ?? "beginner",
      learningScore: 0,
      screenTimeLimit: child.screenTimeLimit ?? 60,
      avatarColor: child.avatarColor ?? "blue",
    };
    this.childrenStore.set(newChild.id, newChild);
    return newChild;
  }

  async updateChild(id: number, updates: UpdateChild): Promise<Child> {
    const existing = this.childrenStore.get(id);
    if (!existing) throw new Error(this.formatError("updateChild", `Child ${id} not found`));
    const updated: Child = { ...existing, ...updates };
    this.childrenStore.set(id, updated);
    return updated;
  }

  async getModules(): Promise<Module[]> {
    return Array.from(this.modulesStore.values());
  }

  async getModule(id: number): Promise<Module | undefined> {
    return this.modulesStore.get(id);
  }

  async createModule(mod: InsertModule): Promise<Module> {
    const newModule: Module = {
      id: this.nextModuleId++,
      title: mod.title,
      description: mod.description,
      type: mod.type,
      difficultyLevel: mod.difficultyLevel ?? 1,
      contentUrl: mod.contentUrl ?? null,
    };
    this.modulesStore.set(newModule.id, newModule);
    return newModule;
  }

  async recordProgress(childId: number, moduleId: number, score?: number): Promise<Progress> {
    const newProgress: Progress = {
      id: this.nextProgressId++,
      childId,
      moduleId,
      completed: true,
      score: score || 0,
      completedAt: new Date(),
    };
    this.progressStore.set(newProgress.id, newProgress);

    const pointsEarned = 10 + (score || 0);
    const child = await this.getChild(childId);
    if (child) {
      await this.updateChild(childId, { learningScore: child.learningScore + pointsEarned });
    }

    return newProgress;
  }

  async getRecentProgress(childId: number): Promise<Progress[]> {
    return Array.from(this.progressStore.values())
      .filter((p) => p.childId === childId)
      .sort((a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }

  async getParentAnalytics(parentId: string): Promise<ParentAnalytics> {
    const parentChildren = await this.getChildren(parentId);
    if (parentChildren.length === 0) {
      return {
        children: [],
        overallStats: { totalModulesCompleted: 0, totalScore: 0, averageScore: 0, activeChildren: 0 },
        weeklyActivity: [],
      };
    }

    const childIds = new Set(parentChildren.map((c) => c.id));
    const allProgressEntries = Array.from(this.progressStore.values()).filter((p) =>
      childIds.has(p.childId),
    );

    const childAnalytics: ChildAnalytics[] = parentChildren.map((child) => {
      const childProgress = allProgressEntries.filter((p) => p.childId === child.id);
      const scores = childProgress.map((p) => p.score ?? 0);
      const avgScore =
        scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      const typeMap = new Map<string, number>();
      childProgress.forEach((p) => {
        const mod = this.modulesStore.get(p.moduleId);
        if (mod) typeMap.set(mod.type, (typeMap.get(mod.type) || 0) + 1);
      });

      return {
        childId: child.id,
        childName: child.name,
        avatarColor: child.avatarColor,
        totalScore: child.learningScore,
        modulesCompleted: childProgress.length,
        averageScore: avgScore,
        recentScores: childProgress.slice(0, 10).map((p) => {
          const mod = this.modulesStore.get(p.moduleId);
          return {
            date: p.completedAt
              ? new Date(p.completedAt).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            score: p.score ?? 0,
            moduleTitle: mod?.title ?? "Unknown",
          };
        }),
        moduleTypeBreakdown: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
      };
    });

    const totalCompleted = allProgressEntries.length;
    const allScores = allProgressEntries.map((p) => p.score ?? 0);
    const totalScoreSum = allScores.reduce((a, b) => a + b, 0);
    const overallAvg = allScores.length > 0 ? Math.round(totalScoreSum / allScores.length) : 0;
    const activeChildren = childAnalytics.filter((c) => c.modulesCompleted > 0).length;

    return {
      children: childAnalytics,
      overallStats: {
        totalModulesCompleted: totalCompleted,
        totalScore: totalScoreSum,
        averageScore: overallAvg,
        activeChildren,
      },
      weeklyActivity: this.buildWeeklyActivity(allProgressEntries),
    };
  }
}

// ── POLYMORPHISM + OBJECT ───────────────────────────────────────────
// The factory returns whichever implementation fits the environment.
// All callers use the IStorage interface — they never know or care
// which concrete class is behind it.

function createStorage(): IStorage {
  return new DatabaseStorage(db);
}

export const storage = createStorage();
