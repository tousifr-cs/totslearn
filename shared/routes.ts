import { z } from 'zod';
import { insertChildSchema, insertModuleSchema } from './schema';
import type { Child, Module, Progress, User } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    me: {
      method: 'GET' as const,
      path: '/api/auth/user' as const,
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  children: {
    list: {
      method: 'GET' as const,
      path: '/api/children' as const,
      responses: {
        200: z.array(z.custom<Child>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/children/:id' as const,
      responses: {
        200: z.custom<Child>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/children' as const,
      input: insertChildSchema.omit({ parentId: true }),
      responses: {
        201: z.custom<Child>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/children/:id' as const,
      input: insertChildSchema.partial(),
      responses: {
        200: z.custom<Child>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    getDashboard: {
      method: 'GET' as const,
      path: '/api/children/:id/dashboard' as const,
      responses: {
        200: z.object({
          child: z.custom<Child>(),
          recentProgress: z.array(z.any()),
          activeChallenges: z.array(z.any()),
          recommendedModules: z.array(z.custom<Module>()),
        }),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      }
    }
  },
  modules: {
    list: {
      method: 'GET' as const,
      path: '/api/modules' as const,
      responses: {
        200: z.array(z.custom<Module>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/modules/:id' as const,
      responses: {
        200: z.custom<Module>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/modules' as const,
      input: insertModuleSchema,
      responses: {
        201: z.custom<Module>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  progress: {
    record: {
      method: 'POST' as const,
      path: '/api/progress' as const,
      input: z.object({ childId: z.string(), moduleId: z.string(), score: z.coerce.number().optional() }),
      responses: {
        200: z.custom<Progress>(),
        400: errorSchemas.validation,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
