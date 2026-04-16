import type { AppRole } from "@shared/models/auth";

/** Logged-in “home” for each role. Marketing lives at `/` (see `HomeRoute`). */
export function homePathForRole(role: AppRole | undefined): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "child":
      return "/child";
    case "parent":
      return "/parent";
    default:
      return "/parent";
  }
}
