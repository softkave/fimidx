# PostgreSQL Storage Implementation

This directory contains the PostgreSQL implementation of the `IObjStorage` interface using Drizzle ORM.

## Files

- `PostgresObjStorage.ts` - Main PostgreSQL storage implementation
- `index.ts` - Export file for the PostgreSQL storage

## Usage

The PostgreSQL storage can be used through the `StorageFactory`:

```typescript
import { StorageFactory } from "../StorageFactory.js";

const storage = StorageFactory.createStorage({ type: "postgres" });
```

## Features

- **CRUD Operations**: Full create, read, update, and delete operations
- **Query Support**: Uses the existing `PostgresQueryTransformer` for complex queries
- **Soft Deletes**: Implements soft delete functionality
- **Pagination**: Built-in pagination support
- **Sorting**: Configurable sorting with multiple fields
- **Tag-based Filtering**: Support for tag-based object organization

## Database Schema

The implementation uses the existing PostgreSQL schema defined in `../../db/fimidx.postgres.ts`:

- `objs` table - Main objects table with JSONB storage for flexible data
- `obj_fields` table - Field metadata
- `obj_parts` table - Indexed object parts for efficient querying

## Dependencies

- Drizzle ORM for database operations
- Existing `PostgresQueryTransformer` for query transformation
- PostgreSQL database with the required schema
