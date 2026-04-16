export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type UpsertUser = Partial<User> & { id: string };

/** App role for demo / session API; omitted for Replit users who use DB profile only. */
export type AppRole = "parent" | "admin" | "child";

export type AuthUser = User & { role?: AppRole; childId?: string };
