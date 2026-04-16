import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const admins = pgTable("admins", {
  userId: varchar("user_id").references(() => users.id).primaryKey(),
});

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  parentId: varchar("parent_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  level: text("level").notNull().default('beginner'),
  learningScore: integer("learning_score").notNull().default(0),
  screenTimeLimit: integer("screen_time_limit").notNull().default(60), // in minutes
  avatarColor: text("avatar_color").notNull().default('blue'),
});

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'video', 'game', 'story', 'drawing'
  difficultyLevel: integer("difficulty_level").notNull().default(1),
  contentUrl: text("content_url"), // Optional URL to external content
});

export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  moduleId: integer("module_id").references(() => modules.id).notNull(),
  completed: boolean("completed").notNull().default(false),
  score: integer("score").default(0),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const dailyChallenges = pgTable("daily_challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull().default(10),
});

export const childChallenges = pgTable("child_challenges", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  challengeId: integer("challenge_id").references(() => dailyChallenges.id).notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

// Zod schemas
export const insertChildSchema = createInsertSchema(children).omit({ id: true, learningScore: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true });
export const insertProgressSchema = createInsertSchema(progress).omit({ id: true, completedAt: true });
export const insertDailyChallengeSchema = createInsertSchema(dailyChallenges).omit({ id: true });

// Types
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
/** Updates from API use Partial<InsertChild>; server may also set learningScore (omitted from inserts). */
export type UpdateChild = Partial<InsertChild> & Partial<Pick<Child, "learningScore">>;
export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Progress = typeof progress.$inferSelect;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type ChildChallenge = typeof childChallenges.$inferSelect;
