# Query Transformers

This directory contains query transformers that convert `IObjQuery` objects into database-specific query formats.

## Overview

The query transformers implement the `IQueryTransformer<T>` interface and extend `BaseQueryTransformer<T>`. They provide a unified way to transform high-level query objects into database-specific query formats.

## Available Transformers

### 1. MongoQueryTransformer

Transforms `IObjQuery` objects into MongoDB `FilterQuery<IObj>` objects.

**Usage:**

```typescript
import { MongoQueryTransformer } from "./MongoQueryTransformer.js";

const transformer = new MongoQueryTransformer();
const filter = transformer.transformFilter(query, new Date());
const sort = transformer.transformSort(sortList);
const pagination = transformer.transformPagination(page, limit);
```

### 2. PostgresQueryTransformer

Transforms `IObjQuery` objects into Drizzle ORM SQL objects for PostgreSQL.

**Usage:**

```typescript
import { PostgresQueryTransformer } from "./PostgresQueryTransformer.js";
import { fmdxPostgresDb, objs } from "../../db/fmdx.postgres.js";

const transformer = new PostgresQueryTransformer();
const filter = transformer.transformFilter(query, new Date());
const sort = transformer.transformSort(sortList);
const pagination = transformer.transformPagination(page, limit);

// Use with Drizzle ORM
const results = await fmdxPostgresDb
  .select()
  .from(objs)
  .where(filter)
  .orderBy(sort)
  .limit(limit)
  .offset(page * limit);
```

## JSONB Field Queries

The PostgreSQL transformer supports querying nested JSONB fields using dot notation:

```typescript
const query = {
  appId: "my-app-id",
  partQuery: {
    and: [
      // Query obj_record.status field
      { op: "eq" as const, field: "status", value: "active" },
      // Query obj_record.user.name field (nested)
      { op: "like" as const, field: "user.name", value: "john" },
      // Query obj_record.metadata.tags array
      {
        op: "in" as const,
        field: "metadata.tags",
        value: ["important", "urgent"],
      },
      // Query obj_record.settings.enabled boolean
      { op: "exists" as const, field: "settings.enabled", value: true },
      // Query obj_record.stats.views number
      { op: "gte" as const, field: "stats.views", value: 1000 },
      // Query obj_record.created range
      {
        op: "between" as const,
        field: "created",
        value: ["2024-01-01", "2024-12-31"] as [string, string],
      },
    ],
  },
};
```

## Supported Operations

Both transformers support the following operations:

- `eq` - Equal to (string, number)
- `neq` - Not equal to (string, number)
- `gt` - Greater than (number, date, duration)
- `gte` - Greater than or equal to (number, date, duration)
- `lt` - Less than (number, date, duration)
- `lte` - Less than or equal to (number, date, duration)
- `like` - Pattern matching (string, with case sensitivity option)
- `in` - In array (string[], number[])
- `not_in` - Not in array (string[], number[])
- `between` - Between range ([min, max])
- `exists` - Field exists (boolean)

## Duration Support

Both transformers support duration strings for date/time operations:

- `"1d"` - 1 day
- `"2h"` - 2 hours
- `"30m"` - 30 minutes
- `"45s"` - 45 seconds

These are relative to the current date when the query is executed.

## Meta Queries

Meta queries allow filtering on database columns (not JSONB fields):

```typescript
const query = {
  appId: "my-app-id",
  metaQuery: {
    createdAt: {
      gte: "2024-01-01T00:00:00Z",
      lt: "2024-12-31T23:59:59Z",
    },
    updatedBy: {
      in: ["user1", "user2"],
    },
  },
};
```

## Logical Queries

Support for AND/OR logical operations:

```typescript
const query = {
  appId: "my-app-id",
  partQuery: {
    and: [
      { op: "eq" as const, field: "status", value: "active" },
      { op: "gt" as const, field: "score", value: 100 },
    ],
    or: [
      { op: "in" as const, field: "category", value: ["tech", "science"] },
      {
        op: "between" as const,
        field: "price",
        value: [10, 50] as [number, number],
      },
    ],
  },
};
```

## Examples

See `PostgresQueryTransformer.example.ts` for comprehensive usage examples.
