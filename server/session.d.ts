import "express-session";

declare module "express-session" {
  interface SessionData {
    demoUser?: {
      claims: { sub: string };
      access_token: string;
      role: "parent" | "admin" | "child";
      childId?: string;
    };
  }
}
