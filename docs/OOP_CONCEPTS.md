# OOP Concepts in Learning-Hub

All six Object-Oriented Programming concepts are implemented in a single file:
**`server/storage.ts`**

The rest of the application (`routes.ts`, client hooks, etc.) depends only on the
`IStorage` interface and the exported `storage` object, so every concept is
demonstrated without touching any other file.

---

## Class Hierarchy

```
IStorage  (interface — abstraction)
   │
   ▼
BaseStorage  (abstract class — inheritance + encapsulation)
   ├── DatabaseStorage  (concrete class — PostgreSQL via Drizzle)
   └── InMemoryStorage  (concrete class — in-memory Maps)
                │
        createStorage()  (factory function — polymorphism)
                │
                ▼
        storage  (exported singleton — object)
```

---

## 1. Abstraction

> Define **what** something does without specifying **how**.

**Where:** `IStorage` interface (line 40)

```typescript
export interface IStorage {
  getChildren(parentId: string): Promise<Child[]>;
  getChild(id: number): Promise<Child | undefined>;
  createChild(parentId: string, child: Omit<InsertChild, "parentId">): Promise<Child>;
  updateChild(id: number, updates: Partial<InsertChild>): Promise<Child>;
  getModules(): Promise<Module[]>;
  getModule(id: number): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  recordProgress(childId: number, moduleId: number, score?: number): Promise<Progress>;
  getRecentProgress(childId: number): Promise<Progress[]>;
  getParentAnalytics(parentId: string): Promise<ParentAnalytics>;
}
```

The interface lists ten method signatures — pure contracts. It says nothing about
databases, Maps, SQL, or any implementation detail. Any class that satisfies these
signatures is a valid storage backend.

**Key takeaway:** Callers (like `routes.ts`) program against `IStorage`, not against
a specific class. They never know or care *how* data is stored.

---

## 2. Encapsulation

> Control access to internal state using **private** and **protected** modifiers.

**Where:** `BaseStorage`, `DatabaseStorage`, and `InMemoryStorage`

| Modifier | Member | Accessible from |
|---|---|---|
| `private` | `BaseStorage.errorPrefix` | `BaseStorage` only |
| `private` | `DatabaseStorage.db` | `DatabaseStorage` only |
| `private` | `InMemoryStorage.childrenStore`, `modulesStore`, `progressStore`, `nextChildId`, `nextModuleId`, `nextProgressId` | `InMemoryStorage` only |
| `protected readonly` | `BaseStorage.name` | `BaseStorage` + subclasses |
| `protected` | `BaseStorage.formatError()` | `BaseStorage` + subclasses |
| `protected` | `BaseStorage.buildWeeklyActivity()` | `BaseStorage` + subclasses |

### Example: `private` vs `protected`

```typescript
export abstract class BaseStorage implements IStorage {
  private errorPrefix: string;            // only BaseStorage can read this

  constructor(protected readonly name: string) {  // subclasses can read this
    this.errorPrefix = `[${name}]`;
  }

  protected formatError(operation: string, err: unknown): string {
    return `${this.errorPrefix} ${operation} failed: ${err}`;
    //       ^^^^^^^^^^^^^^^^ private — used internally
  }
}
```

A subclass like `InMemoryStorage` can call `this.formatError(...)` (protected) but
cannot access `this.errorPrefix` (private). External code like `routes.ts` can
access neither.

```typescript
// In InMemoryStorage — this works:
throw new Error(this.formatError("updateChild", `Child ${id} not found`));

// Outside the class hierarchy — these would NOT compile:
// storage.formatError(...)   // Error: protected
// storage.errorPrefix        // Error: private
```

---

## 3. Inheritance

> Share behaviour between classes via a **parent-child** relationship using `extends`.

**Where:** `BaseStorage` is the parent; `DatabaseStorage` and `InMemoryStorage` are children.

```typescript
export abstract class BaseStorage implements IStorage {
  // Shared concrete methods every subclass inherits:
  protected formatError(operation: string, err: unknown): string { ... }
  protected buildWeeklyActivity(entries: ...): ParentAnalytics["weeklyActivity"] { ... }

  // Abstract methods every subclass MUST implement:
  abstract getChildren(parentId: string): Promise<Child[]>;
  abstract getChild(id: number): Promise<Child | undefined>;
  // ... (10 abstract methods total)
}

export class DatabaseStorage extends BaseStorage {
  constructor(database: typeof db) {
    super("DatabaseStorage");          // calls BaseStorage constructor
    // ...
  }
  // implements all 10 abstract methods using Drizzle/PostgreSQL
}

export class InMemoryStorage extends BaseStorage {
  constructor() {
    super("InMemoryStorage");          // calls BaseStorage constructor
  }
  // implements all 10 abstract methods using Maps
}
```

### What is inherited (not re-implemented)

Both `DatabaseStorage` and `InMemoryStorage` get `formatError()` and
`buildWeeklyActivity()` for free. Both call `this.buildWeeklyActivity(...)` in
their `getParentAnalytics` method without having to duplicate the weekly-bucketing
logic.

---

## 4. Class

> A **blueprint** for creating objects — defines properties and methods.

**Where:** Three classes in `server/storage.ts`

| Class | Role | Key Properties |
|---|---|---|
| `BaseStorage` | Abstract parent — shared logic + contracts | `name`, `errorPrefix` |
| `DatabaseStorage` | Concrete — PostgreSQL persistence | `db` (Drizzle instance) |
| `InMemoryStorage` | Concrete — in-memory persistence | `childrenStore`, `modulesStore`, `progressStore`, auto-increment IDs |

A class is a template. It does not hold real data until you **instantiate** it
(see Objects below).

---

## 5. Object

> A **concrete instance** of a class, created with `new`.

**Where:** The `createStorage()` factory and the exported `storage` singleton.

```typescript
function createStorage(): IStorage {
  return new DatabaseStorage(db);   // <-- creates an OBJECT from the class
}

export const storage = createStorage();
```

- `new DatabaseStorage(db)` creates one **object** of type `DatabaseStorage`.
- That object is assigned to `storage` and used throughout the application.
- You could equally write `new InMemoryStorage()` to create an object of the
  other class.

Every time you call a method on `storage` — for example
`storage.getChildren(userId)` in `routes.ts` — you are calling a method on this
**object**.

---

## 6. Polymorphism

> Objects of different classes can be used **interchangeably** through a shared
> interface or parent type.

**Where:** The `createStorage()` factory function + how `routes.ts` consumes it.

```typescript
// Factory — returns IStorage regardless of which class is behind it
function createStorage(): IStorage {
  return new DatabaseStorage(db);
  // Could just as easily be: return new InMemoryStorage();
}

export const storage = createStorage();
```

In `routes.ts`:

```typescript
import { storage } from "./storage";

// routes.ts has NO idea which class this is — it only sees IStorage
const parentChildren = await storage.getChildren(userId);
```

Both `DatabaseStorage` and `InMemoryStorage` satisfy the `IStorage` contract.
Swapping one for the other requires **zero changes** in any consuming file.
That substitutability is polymorphism.

---

## Quick Reference Table

| OOP Concept | Where in `server/storage.ts` | Line(s) |
|---|---|---|
| **Abstraction** | `IStorage` interface | 40-54 |
| **Encapsulation** | `private errorPrefix`, `private db`, `private childrenStore/...`, `protected formatError()`, `protected buildWeeklyActivity()` | 64, 114, 267-272, 70-72, 74-94 |
| **Inheritance** | `BaseStorage` abstract class; `DatabaseStorage extends BaseStorage`; `InMemoryStorage extends BaseStorage` | 63-106, 113, 266 |
| **Class** | `BaseStorage`, `DatabaseStorage`, `InMemoryStorage` | 63, 113, 266 |
| **Object** | `new DatabaseStorage(db)` inside `createStorage()` | 434 |
| **Polymorphism** | `createStorage(): IStorage` — callers use the interface, not the class | 433-435 |
