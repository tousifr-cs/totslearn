import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { z } from "zod";

export type ParentAnalytics = z.infer<typeof api.analytics.parent.responses[200]>;

export function useParentAnalytics() {
  return useQuery<ParentAnalytics>({
    queryKey: [api.analytics.parent.path],
    queryFn: async () => {
      const res = await fetch(api.analytics.parent.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });
}
