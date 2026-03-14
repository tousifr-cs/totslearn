import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useChildren() {
  return useQuery({
    queryKey: [api.children.list.path],
    queryFn: async () => {
      const res = await fetch(api.children.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch children");
      return parseWithLogging(api.children.list.responses[200], await res.json(), "children.list");
    },
  });
}

export function useChild(id: string) {
  return useQuery({
    queryKey: [api.children.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.children.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch child");
      return parseWithLogging(api.children.get.responses[200], await res.json(), "children.get");
    },
    enabled: !!id,
  });
}

export function useChildDashboard(id: string) {
  return useQuery({
    queryKey: [api.children.getDashboard.path, id],
    queryFn: async () => {
      const url = buildUrl(api.children.getDashboard.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch child dashboard");
      return parseWithLogging(api.children.getDashboard.responses[200], await res.json(), "children.getDashboard");
    },
    enabled: !!id,
  });
}

export function useCreateChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.children.create.input>) => {
      const res = await fetch(api.children.create.path, {
        method: api.children.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.children.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create child");
      }
      return parseWithLogging(api.children.create.responses[201], await res.json(), "children.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.children.list.path] });
    },
  });
}

export function useUpdateChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & z.infer<typeof api.children.update.input>) => {
      const url = buildUrl(api.children.update.path, { id });
      const res = await fetch(url, {
        method: api.children.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update child");
      return parseWithLogging(api.children.update.responses[200], await res.json(), "children.update");
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.children.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.children.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.children.getDashboard.path, id] });
    },
  });
}
