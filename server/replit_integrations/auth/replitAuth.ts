import session from "express-session";
import type { Express, RequestHandler } from "express";
import MongoStore from "connect-mongo";
import { authStorage } from "./storage";

const DEV_USER_ID = "dev-user";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: sessionTtl / 1000,
    collectionName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.use(getSession());

  await authStorage.upsertUser({
    id: DEV_USER_ID,
    email: "dev@local.dev",
    firstName: "Dev",
    lastName: "User",
    profileImageUrl: null,
  });

  app.use((req: any, _res, next) => {
    req.user = { claims: { sub: DEV_USER_ID } };
    req.isAuthenticated = () => true;
    next();
  });

  app.get("/api/login", (_req, res) => res.redirect("/"));
  app.get("/api/logout", (_req, res) => res.redirect("/"));
}

export const isAuthenticated: RequestHandler = (_req, _res, next) => {
  next();
};
