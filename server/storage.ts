import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { 
  children, 
  modules, 
  progress, 
  type Child, 
  type InsertChild, 
  type Module, 
  type InsertModule, 
  type Progress,
  type User 
} from "@shared/schema";

export interface IStorage {
  // Children
  getChildren(parentId: string): Promise<Child[]>;
  getChild(id: number): Promise<Child | undefined>;
  createChild(parentId: string, child: Omit<InsertChild, "parentId">): Promise<Child>;
  updateChild(id: number, updates: Partial<InsertChild>): Promise<Child>;

  // Modules
  getModules(): Promise<Module[]>;
  getModule(id: number): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;

  // Progress
  recordProgress(childId: number, moduleId: number, score?: number): Promise<Progress>;
  getRecentProgress(childId: number): Promise<Progress[]>;
}

export class DatabaseStorage implements IStorage {
  async getChildren(parentId: string): Promise<Child[]> {
    return await db.select().from(children).where(eq(children.parentId, parentId));
  }

  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async createChild(parentId: string, child: Omit<InsertChild, "parentId">): Promise<Child> {
    const [newChild] = await db
      .insert(children)
      .values({ ...child, parentId })
      .returning();
    return newChild;
  }

  async updateChild(id: number, updates: Partial<InsertChild>): Promise<Child> {
    const [updatedChild] = await db
      .update(children)
      .set(updates)
      .where(eq(children.id, id))
      .returning();
    return updatedChild;
  }

  async getModules(): Promise<Module[]> {
    return await db.select().from(modules);
  }

  async getModule(id: number): Promise<Module | undefined> {
    const [mod] = await db.select().from(modules).where(eq(modules.id, id));
    return mod;
  }

  async createModule(mod: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values(mod).returning();
    return newModule;
  }

  async recordProgress(childId: number, moduleId: number, score?: number): Promise<Progress> {
    const [newProgress] = await db
      .insert(progress)
      .values({
        childId,
        moduleId,
        completed: true,
        score: score || 0,
      })
      .returning();

    // Give some points to the child's learning score
    const pointsEarned = 10 + (score || 0);
    const child = await this.getChild(childId);
    if (child) {
      await this.updateChild(childId, { learningScore: child.learningScore + pointsEarned });
    }

    return newProgress;
  }

  async getRecentProgress(childId: number): Promise<Progress[]> {
    return await db
      .select()
      .from(progress)
      .where(eq(progress.childId, childId))
      .orderBy(desc(progress.completedAt))
      .limit(10);
  }
}

export const storage = new DatabaseStorage();
