---
name: Writing Type Guards
description: Safe TypeScript type guard functions that satisfy the type checker without unsafe assertions
when_to_use: When writing `obj is Type` functions. When TypeScript errors about property access on unknown types. When using `any` parameters. When checking object structure at runtime for validation or deserialization.
version: 1.0.0
languages: [typescript]
---

# Writing Type Guards

## Overview

Type guards are functions that narrow TypeScript types at runtime. Following four simple rules eliminates all type checker errors without resorting to `@ts-ignore` or excessive type assertions.

## When to Use

**Use type guards when:**

- Validating data from external sources (APIs, files, user input)
- Deserializing JSON with unknown structure
- Writing defensive validation functions
- Need runtime type checking with compile-time type narrowing

**TypeScript errors indicating you need this:**

- "Property 'x' does not exist on type 'unknown'"
- "Object is of type 'unknown'"
- "Unsafe assignment of 'any' value"
- "Property 'x' does not exist on type 'never'"

## The Four Rules

### 1. Accept `unknown`, Never `any`

```typescript
// ❌ BAD: any disables type checking
function isValidUser(obj: any): obj is User;

// ✅ GOOD: unknown forces type checking
function isValidUser(obj: unknown): obj is User;
```

### 2. Check Truthy, Then `typeof 'object'`

```typescript
// ❌ BAD: null/undefined are typeof 'object'
if (typeof obj === 'object') { ... }

// ✅ GOOD: eliminate null/undefined first
if (!!obj && typeof obj === 'object') { ... }
```

### 3. Use `!!` for Truthiness

```typescript
// ❌ BAD: implicit coercion
if (obj) { ... }

// ✅ GOOD: explicit boolean conversion
if (!!obj) { ... }
```

### 4. Check Property Existence Before Access

```typescript
// ❌ BAD: TypeScript doesn't know property exists
if (obj.id === 'string') { ... }

// ✅ GOOD: in operator narrows type
if ('id' in obj && typeof obj.id === 'string') { ... }
```

## Complete Pattern

```typescript
function isValidBenchmarkRun(obj: unknown): obj is BenchmarkRun {
  return (
    // Rule 2 & 3: Check truthy and object type
    !!obj &&
    typeof obj === 'object' &&
    // Rule 4: Check property existence, then validate
    'id' in obj &&
    typeof obj.id === 'string' &&
    'files' in obj &&
    Array.isArray(obj.files) &&
    'startTime' in obj &&
    !!obj.startTime &&
    'endTime' in obj &&
    !!obj.endTime &&
    'environment' in obj &&
    !!obj.environment &&
    'summary' in obj &&
    !!obj.summary
  );
}
```

## Common Mistakes

### Forgetting `null` is `typeof 'object'`

```typescript
// ❌ WRONG: passes null through
typeof null === 'object'; // true!

// ✅ RIGHT: !! eliminates null
!!null && typeof null === 'object'; // false
```

### Accessing Before Checking

```typescript
// ❌ WRONG: TypeScript error - property might not exist
if (typeof obj.id === 'string')

// ✅ RIGHT: verify existence first
if ('id' in obj && typeof obj.id === 'string')
```

### Using Optional Chaining

```typescript
// ❌ WRONG: doesn't narrow type for TypeScript
if (obj?.id)  // TypeScript still treats obj as unknown

// ✅ RIGHT: explicit checks narrow types
if (!!obj && 'id' in obj && obj.id)
```

## Why This Works

- `unknown` forces you to validate before using
- `!!obj && typeof obj === 'object'` eliminates `null`, `undefined`, primitives
- `'prop' in obj` tells TypeScript the property exists
- After checks, TypeScript narrows the type automatically
- No `@ts-ignore`, no `as any`, no type assertions needed
