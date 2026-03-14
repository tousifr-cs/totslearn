import { z } from "zod";

export type { User, UpsertUser } from "./models/auth";

// --- Interfaces ---

export interface Child {
  id: string;
  parentId: string;
  name: string;
  age: number;
  level: string;
  learningScore: number;
  screenTimeLimit: number;
  avatarColor: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  type: string;
  difficultyLevel: number;
  contentUrl: string | null;
}

export interface Progress {
  id: string;
  childId: string;
  moduleId: string;
  completed: boolean;
  score: number | null;
  completedAt: Date | null;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
}

export interface ChildChallenge {
  id: string;
  childId: string;
  challengeId: string;
  completed: boolean;
  completedAt: Date | null;
}

// --- Zod input schemas ---

export const insertChildSchema = z.object({
  parentId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(1).max(18),
  level: z.string().default("beginner"),
  screenTimeLimit: z.coerce.number().default(60),
  avatarColor: z.string().default("blue"),
});

export const insertModuleSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.string().min(1),
  difficultyLevel: z.coerce.number().default(1),
  contentUrl: z.string().nullable().optional(),
});

export const insertProgressSchema = z.object({
  childId: z.string(),
  moduleId: z.string(),
  completed: z.boolean().default(false),
  score: z.coerce.number().optional(),
});

export const insertDailyChallengeSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  points: z.coerce.number().default(10),
});

// --- Inferred input types ---

export type InsertChild = z.infer<typeof insertChildSchema>;
export type InsertModule = z.infer<typeof insertModuleSchema>;
