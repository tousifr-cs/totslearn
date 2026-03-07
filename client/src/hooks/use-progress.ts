import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { z } from "zod";

export function useRecordProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.progress.record.input>) => {
      const res = await fetch(api.progress.record.path, {
        method: api.progress.record.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to record progress");
      return api.progress.record.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate the child's dashboard so their learning score updates immediately
      queryClient.invalidateQueries({ 
        queryKey: [api.children.getDashboard.path, variables.childId] 
      });
    },
  });
}
