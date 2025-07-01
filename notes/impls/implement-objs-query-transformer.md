# Implement Objs Query Transformer

I need to implement a database abstraction layer for fmdx's object query system. Currently, the application uses MongoDB with Mongoose for data persistence, but I want to create a storage-agnostic interface that allows switching between different database engines. The goal is to extract the existing MongoDB/Mongoose implementation into a concrete class that implements an abstract storage interface. This interface should also be implemented for PostgreSQL and SQLite using their JSONB capabilities. The abstraction should provide comprehensive CRUD operations, not just query functionality. Alternative implementation approaches are welcome.

## Implementation Plan

### 1. Abstract Interface Design

Create an abstract interface that defines the contract for all storage implementations:

```typescript
// src/storage/IObjStorage.ts
export interface IObjStorage {
  // CRUD Operations
  create(params: CreateObjsParams): Promise<CreateObjsResult>;
  read(params: ReadObjsParams): Promise<ReadObjsResult>;
  update(params: UpdateObjsParams): Promise<UpdateObjsResult>;
  delete(params: DeleteObjsParams): Promise<DeleteObjsResult>;

  // Indexing Operations
  indexFields(params: IndexFieldsParams): Promise<void>;
  indexParts(params: IndexPartsParams): Promise<void>;

  // Field Operations
  getFields(params: GetFieldsParams): Promise<GetFieldsResult>;
  getFieldValues(params: GetFieldValuesParams): Promise<GetFieldValuesResult>;

  // Utility Operations
  cleanup(params: CleanupParams): Promise<void>;
}
```

### 2. Query Transformation Layer

Create a query transformer that converts fmdx query definitions to database-specific queries:

```typescript
// src/storage/query/QueryTransformer.ts
export interface IQueryTransformer<T> {
  transformFilter(query: IObjQuery, date: Date): T;
  transformSort(sort: IObjSortList): T;
  transformPagination(page: number, limit: number): T;
}
```

### 3. Implementation Strategy

#### Phase 1: Extract MongoDB Implementation

- Create `MongoObjStorage` class implementing `IObjStorage`
- Move existing MongoDB logic from server helpers to this class
- Create `MongoQueryTransformer` for MongoDB-specific query conversion
- Update existing code to use the new abstraction

#### Phase 2: PostgreSQL Implementation

- Create `PostgresObjStorage` class using JSONB
- Implement `PostgresQueryTransformer` for PostgreSQL JSONB queries
- Use Drizzle ORM for PostgreSQL operations
- Schema design for PostgreSQL JSONB storage

#### Phase 3: SQLite Implementation

- Create `SqliteObjStorage` class using JSONB (SQLite 3.38+)
- Implement `SqliteQueryTransformer` for SQLite JSONB queries
- Leverage existing Drizzle SQLite setup

### 4. Detailed Implementation Steps

#### Step 1: Define Core Interfaces and Types

```typescript
// src/storage/types.ts
export interface CreateObjsParams {
  objs: IObj[];
  shouldIndex?: boolean;
}

export interface ReadObjsParams {
  query: IObjQuery;
  tag: string;
  page?: number;
  limit?: number;
  sort?: IObjSortList;
  date?: Date;
  includeDeleted?: boolean;
}

export interface UpdateObjsParams {
  query: IObjQuery;
  tag: string;
  update: AnyObject;
  by: string;
  byType: string;
  updateWay?: OnConflict;
  count?: number;
  shouldIndex?: boolean;
  fieldsToIndex?: string[];
}

export interface DeleteObjsParams {
  query: IObjQuery;
  tag: string;
  date?: Date;
  deletedBy: string;
  deletedByType: string;
  deleteMany?: boolean;
}
```

#### Step 2: Create Query Transformer Base

```typescript
// src/storage/query/BaseQueryTransformer.ts
export abstract class BaseQueryTransformer<T> implements IQueryTransformer<T> {
  abstract transformFilter(query: IObjQuery, date: Date): T;
  abstract transformSort(sort: IObjSortList): T;
  abstract transformPagination(page: number, limit: number): T;

  protected transformPartQuery(partQuery: IObjPartQueryList, date: Date): T {
    // Common logic for transforming part queries
  }

  protected transformMetaQuery(metaQuery: IObjMetaQuery, date: Date): T {
    // Common logic for transforming meta queries
  }
}
```

#### Step 3: MongoDB Implementation

```typescript
// src/storage/mongo/MongoObjStorage.ts
export class MongoObjStorage implements IObjStorage {
  constructor(
    private objModel: Model<IObj>,
    private queryTransformer: MongoQueryTransformer
  ) {}

  async create(params: CreateObjsParams): Promise<CreateObjsResult> {
    const objs = await this.objModel.insertMany(params.objs);
    return { objs };
  }

  async read(params: ReadObjsParams): Promise<ReadObjsResult> {
    const filter = this.queryTransformer.transformFilter(
      params.query,
      params.date
    );
    const sort = params.sort
      ? this.queryTransformer.transformSort(params.sort)
      : { createdAt: -1 };
    const pagination = this.queryTransformer.transformPagination(
      params.page || 0,
      params.limit || 100
    );

    const objs = await this.objModel
      .find(filter)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      objs,
      page: params.page || 0,
      limit: params.limit || 100,
      hasMore: objs.length === pagination.limit,
    };
  }

  // ... other methods
}
```

#### Step 4: PostgreSQL Implementation

```typescript
// src/storage/postgres/PostgresObjStorage.ts
export class PostgresObjStorage implements IObjStorage {
  constructor(
    private db: NodePgDatabase,
    private queryTransformer: PostgresQueryTransformer
  ) {}

  async create(params: CreateObjsParams): Promise<CreateObjsResult> {
    const objs = await this.db
      .insert(objsTable)
      .values(params.objs)
      .returning();
    return { objs };
  }

  async read(params: ReadObjsParams): Promise<ReadObjsResult> {
    const where = this.queryTransformer.transformFilter(
      params.query,
      params.date
    );
    const orderBy = params.sort
      ? this.queryTransformer.transformSort(params.sort)
      : { createdAt: "desc" };
    const pagination = this.queryTransformer.transformPagination(
      params.page || 0,
      params.limit || 100
    );

    const objs = await this.db
      .select()
      .from(objsTable)
      .where(where)
      .orderBy(orderBy)
      .limit(pagination.limit)
      .offset(pagination.offset);

    return {
      objs,
      page: params.page || 0,
      limit: params.limit || 100,
      hasMore: objs.length === pagination.limit,
    };
  }

  // ... other methods
}
```

#### Step 5: SQLite Implementation

```typescript
// src/storage/sqlite/SqliteObjStorage.ts
export class SqliteObjStorage implements IObjStorage {
  constructor(
    private db: LibSQLDatabase,
    private queryTransformer: SqliteQueryTransformer
  ) {}

  // Similar implementation to PostgreSQL but using SQLite JSONB functions
  // Use json_extract() and json_each() for JSONB operations
}
```

### 5. Migration Strategy

#### Step 1: Gradual Migration

- Create factory pattern for storage selection
- Add configuration option to choose storage backend
- Maintain backward compatibility during transition

```typescript
// src/storage/StorageFactory.ts
export class StorageFactory {
  static createStorage(
    type: "mongo" | "postgres" | "sqlite",
    config: StorageConfig
  ): IObjStorage {
    switch (type) {
      case "mongo":
        return new MongoObjStorage(
          config.mongoModel,
          new MongoQueryTransformer()
        );
      case "postgres":
        return new PostgresObjStorage(
          config.postgresDb,
          new PostgresQueryTransformer()
        );
      case "sqlite":
        return new SqliteObjStorage(
          config.sqliteDb,
          new SqliteQueryTransformer()
        );
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }
}
```

#### Step 2: Update Server Helpers

- Replace direct MongoDB calls with storage interface calls
- Update all obj-related server helpers to use the new abstraction
- Maintain existing API contracts

### 6. Benefits of This Approach

1. **Database Agnostic**: Easy to switch between MongoDB, PostgreSQL, and SQLite
2. **Testable**: Each implementation can be tested independently
3. **Extensible**: New storage backends can be added easily
4. **Performance**: Each implementation can be optimized for its specific database
5. **Maintainable**: Clear separation of concerns between query logic and storage

### 7. Alternative Implementation Suggestions

#### Option A: Repository Pattern with Query Objects

- Use repository pattern instead of direct storage interface
- Implement query objects for complex queries
- Better for complex business logic

#### Option B: Data Access Layer with Query Builders

- Create query builders for each database
- More flexible but more complex
- Better for dynamic queries

#### Option C: GraphQL-like Query Language

- Create a custom query language
- Translate to database-specific queries
- Most flexible but most complex

### 8. Recommended Approach

I recommend **Option A (Repository Pattern)** as it provides:

- Clear separation between business logic and data access
- Easy to test and mock
- Familiar pattern for most developers
- Good balance between flexibility and complexity

### 9. Implementation Timeline

1. **Week 1**: Define interfaces and create MongoDB implementation
2. **Week 2**: Create PostgreSQL implementation and query transformers
3. **Week 3**: Create SQLite implementation and update server helpers
4. **Week 4**: Testing, optimization, and documentation

### 10. Testing Strategy

- Unit tests for each storage implementation
- Integration tests for query transformations
- Performance benchmarks comparing implementations
- Migration tests to ensure data consistency

## Copied over from a different implementation plan

### Phase 5: Testing and Validation

#### 5.1 Test Strategy

1. **Unit Tests**

   - Test each new interface method
   - Verify conflict resolution logic
   - Test merge strategies
   - Validate batch processing

2. **Integration Tests**

   - Test with real MongoDB/PostgreSQL
   - Verify transaction support
   - Test performance with large datasets

3. **Compatibility Tests**
   - Ensure existing code still works
   - Test migration path
   - Verify backward compatibility

#### 5.2 Performance Considerations

1. **Batch Size Optimization**

   - MongoDB: 1000-5000 per batch
   - PostgreSQL: 500-2000 per batch
   - Adjust based on object size

2. **Indexing Strategy**

   - Support for `shouldIndex` and `fieldsToIndex`
   - Automatic index creation
   - Index optimization for conflict detection

3. **Memory Management**
   - Streaming for large operations
   - Garbage collection considerations
   - Memory usage monitoring
