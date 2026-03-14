import { ChildModel, ModuleModel, ProgressModel } from "./models";
import type {
  Child,
  InsertChild,
  Module,
  InsertModule,
  Progress,
} from "@shared/schema";

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
