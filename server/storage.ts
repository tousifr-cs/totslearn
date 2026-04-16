import mongoose from "mongoose";
import { ChildModel, ModuleModel, ProgressModel } from "./models";
import type {
  Child,
  InsertChild,
  Module,
  InsertModule,
  Progress,
} from "@shared/schema";

export interface ChildAnalytics {
  childId: string;
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

export interface IStorage {
  getChildren(parentId: string): Promise<Child[]>;
  getChild(id: string): Promise<Child | undefined>;
  createChild(parentId: string, child: Omit<InsertChild, "parentId">): Promise<Child>;
  updateChild(id: string, updates: Partial<InsertChild>): Promise<Child>;

  getModules(): Promise<Module[]>;
  getModule(id: string): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;

  recordProgress(childId: string, moduleId: string, score?: number): Promise<Progress>;
  getRecentProgress(childId: string): Promise<Progress[]>;
  getParentAnalytics(parentId: string): Promise<ParentAnalytics>;
}

function buildWeeklyActivity(
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

export class DatabaseStorage implements IStorage {
  async getChildren(parentId: string): Promise<Child[]> {
    const docs = await ChildModel.find({ parentId }).lean();
    return docs.map(toChild);
  }

  async getChild(id: string): Promise<Child | undefined> {
    const doc = await ChildModel.findById(id).lean();
    return doc ? toChild(doc) : undefined;
  }

  async createChild(parentId: string, child: Omit<InsertChild, "parentId">): Promise<Child> {
    const doc = await ChildModel.create({ ...child, parentId });
    return toChild(doc.toObject());
  }

  async updateChild(id: string, updates: Partial<InsertChild>): Promise<Child> {
    const doc = await ChildModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    return toChild(doc!);
  }

  async getModules(): Promise<Module[]> {
    const docs = await ModuleModel.find().lean();
    return docs.map(toModule);
  }

  async getModule(id: string): Promise<Module | undefined> {
    const doc = await ModuleModel.findById(id).lean();
    return doc ? toModule(doc) : undefined;
  }

  async createModule(mod: InsertModule): Promise<Module> {
    const doc = await ModuleModel.create(mod);
    return toModule(doc.toObject());
  }

  async recordProgress(childId: string, moduleId: string, score?: number): Promise<Progress> {
    const doc = await ProgressModel.create({
      childId,
      moduleId,
      completed: true,
      score: score || 0,
    });

    const pointsEarned = 10 + (score || 0);
    const child = await this.getChild(childId);
    if (child) {
      await this.updateChild(childId, { learningScore: child.learningScore + pointsEarned } as any);
    }

    return toProgress(doc.toObject());
  }

  async getRecentProgress(childId: string): Promise<Progress[]> {
    const docs = await ProgressModel.find({ childId })
      .sort({ completedAt: -1 })
      .limit(10)
      .lean();
    return docs.map(toProgress);
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
    const oidList = childIds.map((id) => new mongoose.Types.ObjectId(id));
    const progressDocs = await ProgressModel.find({ childId: { $in: oidList } })
      .sort({ completedAt: -1 })
      .lean();

    const moduleIds = Array.from(new Set(progressDocs.map((p) => p.moduleId.toString())));
    const oidM = moduleIds.map((id) => new mongoose.Types.ObjectId(id));
    const moduleDocs = await ModuleModel.find({ _id: { $in: oidM } }).lean();
    const modById = new Map(moduleDocs.map((m) => [m._id.toString(), m]));

    const allProgress = progressDocs.map((p) => {
      const mod = modById.get(p.moduleId.toString());
      return {
        childId: p.childId.toString(),
        completedAt: p.completedAt ?? null,
        score: p.score ?? null,
        moduleTitle: mod?.title ?? "Unknown",
        moduleType: mod?.type ?? "unknown",
      };
    });

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
      weeklyActivity: buildWeeklyActivity(allProgress),
    };
  }
}

function toChild(doc: any): Child {
  return {
    id: doc._id.toString(),
    parentId: doc.parentId,
    name: doc.name,
    age: doc.age,
    level: doc.level ?? "beginner",
    learningScore: doc.learningScore ?? 0,
    screenTimeLimit: doc.screenTimeLimit ?? 60,
    avatarColor: doc.avatarColor ?? "blue",
  };
}

function toModule(doc: any): Module {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    type: doc.type,
    difficultyLevel: doc.difficultyLevel ?? 1,
    contentUrl: doc.contentUrl ?? null,
  };
}

function toProgress(doc: any): Progress {
  return {
    id: doc._id.toString(),
    childId: doc.childId.toString(),
    moduleId: doc.moduleId.toString(),
    completed: doc.completed,
    score: doc.score ?? null,
    completedAt: doc.completedAt ?? null,
  };
}

export const storage = new DatabaseStorage();
