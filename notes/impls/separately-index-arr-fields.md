# Enhanced Array Field Indexing and Query Support

## Overview

Implement intelligent array field detection and query generation to support queries like `reportsTo.userId` where `reportsTo` is an array of objects containing `userId` fields. This addresses the current limitation where Postgres queries can't properly handle array field queries, while MongoDB already supports these natively.

## Core Requirements

### 1. Array Field Detection and Indexing

#### 1.1 Enhanced Array Field Detection

- **Primary Method**: Analyze `indexJson` output to detect fields with numeric keys in their path
- **Secondary Method**: Query `IObjField` table to identify fields that have both array and non-array value types
- **Tertiary Method**: Use field name heuristics (existing logic in PostgresQueryTransformer)
- **Fallback**: Explicit array type annotations in field metadata

#### 1.2 Array Field Metadata Storage

Create a new table `objArrayFields` in SQLite with schema:

```sql
CREATE TABLE objArrayFields (
  id TEXT PRIMARY KEY,
  field TEXT NOT NULL,           -- e.g., 'reportsTo', 'logsQuery.and'
  appId TEXT NOT NULL,
  groupId TEXT NOT NULL,
  tag TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
```

#### 1.3 Array Field Extraction Logic

For each indexed object, extract array fields using this algorithm:

```typescript
function extractArrayFields(indexedJson: IndexedJson): ArrayField[] {
  const arrayFields = new Map<string, ArrayField>();

  for (const [fieldPath, fieldData] of Object.entries(indexedJson)) {
    const segments = fieldPath.split(".");

    // Find array segments (numeric keys)
    for (let i = 0; i < segments.length - 1; i++) {
      if (/^\d+$/.test(segments[i])) {
        // This is an array index, find the parent array field
        const parentPath = segments.slice(0, i).join(".");

        // Store the ARRAY FIELD, not the specific array element
        if (!arrayFields.has(parentPath)) {
          arrayFields.set(parentPath, {
            field: parentPath, // e.g., 'logsQuery.and'
            appId: "...",
            groupId: "...",
            tag: "...",
          });
        }
      }
    }
  }

  return Array.from(arrayFields.values());
}
```

**Example**: From the original requirement:

```
{
  'logsQuery.and.0.op': {
    key: [ 'logsQuery', 'and', 0, 'op' ],
    keyType: [ 'string', 'string', 'number', 'string' ],
    value: [ 'eq' ],
    valueType: Set(1) { 'string' }
  },
  'logsQuery.and.0.op.0.subOp': {
    key: [ 'logsQuery', 'and', 0, 'op', 0, 'subOp' ],
    keyType: [ 'string', 'string', 'number', 'string', 'number', 'string' ],
    value: [ 'eq' ],
    valueType: Set(1) { 'string' }
  },
}

// Will produce array fields:
[
  {
    field: 'logsQuery.and',
    appId: '...',
    groupId: '...',
    tag: '...'
  }
]
```

The process should use a Map to prevent duplication and follow the existing pattern of checking if array fields exist in DB before creating new ones.

### 2. Query Generation Enhancement

#### 2.1 Array Field Context Injection

Modify all storage operation parameters to include array field context for proper query generation:

```typescript
interface ReadObjsParams {
  // ... existing fields
  fields?: IObjField[];
  arrayFields?: Map<string, IObjArrayField>; // NEW: Array field context
}

interface UpdateObjsParams {
  // ... existing fields
  fields?: IObjField[];
  arrayFields?: Map<string, IObjArrayField>; // NEW: Array field context
}

interface DeleteObjsParams {
  // ... existing fields
  fields?: IObjField[];
  arrayFields?: Map<string, IObjArrayField>; // NEW: Array field context
}

interface BulkUpdateParams {
  // ... existing fields
  fields?: IObjField[];
  arrayFields?: Map<string, IObjArrayField>; // NEW: Array field context
}

interface BulkDeleteParams {
  // ... existing fields
  fields?: IObjField[];
  arrayFields?: Map<string, IObjArrayField>; // NEW: Array field context
}
```

#### 2.2 Enhanced Postgres Query Generation

Update `PostgresQueryTransformer.transformPartQuery()` to handle array fields:

```typescript
protected transformArrayFieldQuery(
  field: string,
  operation: string,
  value: any,
  arrayFields: Map<string, IObjArrayField>
): ReturnType<typeof sql> {
  const segments = field.split('.');

  // Check if this field involves array access
  const arrayField = this.findArrayField(field, arrayFields);

  if (arrayField) {
    // Generate PostgreSQL array query
    return this.generateArrayQuery(field, operation, value, arrayField);
  } else {
    // Fall back to regular JSONB query
    return this.generateRegularQuery(field, operation, value);
  }
}

private generateArrayQuery(
  field: string,
  operation: string,
  value: any,
  arrayField: IObjArrayField
): ReturnType<typeof sql> {
  const segments = field.split('.');
  const arrayFieldPath = arrayField.field; // e.g., 'logsQuery.and'

  // Find the part after the array field
  const arrayFieldSegments = arrayFieldPath.split('.');
  const remainingPath = segments.slice(arrayFieldSegments.length).join('.');

  switch (operation) {
    case 'eq':
      return sql`EXISTS (
        SELECT 1 FROM jsonb_array_elements(obj_record#>'{${arrayFieldSegments.join(',')}}') AS arr_elem
        WHERE arr_elem->>'${remainingPath}' = ${value}
      )`;
    case 'in':
      return sql`EXISTS (
        SELECT 1 FROM jsonb_array_elements(obj_record#>'{${arrayFieldSegments.join(',')}}') AS arr_elem
        WHERE arr_elem->>'${remainingPath}' = ANY(${JSON.stringify(value)})
      )`;
    // ... other operations
  }
}
```

This enables queries like:

```
[
  {
    op: 'eq',
    field: 'logsQuery.and.op',
    value: 'eq'
  }
]

// or

[
  {
    op: 'eq',
    field: 'logsQuery.and.op.subOp',
    value: 'eq'
  }
]
```

To generate proper PostgreSQL array queries instead of treating them as regular nested object fields.

#### 2.3 MongoDB Query Enhancement

MongoDB already supports array queries, but enhance for consistency:

```typescript
private generateMongoArrayQuery(
  field: string,
  operation: string,
  value: any,
  arrayField: IObjArrayField
): any {
  const segments = field.split('.');
  const arrayFieldPath = arrayField.field;
  const remainingPath = segments.slice(arrayFieldPath.split('.').length).join('.');

  const fullPath = `${arrayFieldPath}.${remainingPath}`;

  switch (operation) {
    case 'eq':
      return { [`objRecord.${fullPath}`]: value };
    case 'in':
      return { [`objRecord.${fullPath}`]: { $in: value } };
    // ... other operations
  }
}
```

### 3. Field Path Analysis for Query Generation

When processing queries, we need to analyze field paths to identify array contexts:

```typescript
function analyzeFieldPaths(queryFields: string[]): Map<string, string[]> {
  const pathMap = new Map<string, string[]>();

  for (const field of queryFields) {
    const segments = field.split(".");
    const paths = [];

    // Generate all possible parent paths
    for (let i = 1; i <= segments.length; i++) {
      paths.push(segments.slice(0, i).join("."));
    }

    pathMap.set(field, paths);
  }

  return pathMap;
}
```

**Example**: For query field `'a.b.c.0.d'`, generate:

- `'a'`
- `'a.b'`
- `'a.b.c'`
- `'a.b.c.0'`
- `'a.b.c.0.d'`

This helps identify which array fields are relevant for the query.

### 4. Integration Points

#### 4.1 Storage Layer Integration

Update all storage operations to pass array field context for proper query generation:

- `read()`: Pass both `fields` and `arrayFields` for query generation
- `update()`: Pass both `fields` and `arrayFields` for query generation
- `delete()`: Pass both `fields` and `arrayFields` for query generation
- `bulkUpdate()`: Pass both `fields` and `arrayFields` for query generation
- `bulkDelete()`: Pass both `fields` and `arrayFields` for query generation

**Note**: All operations that generate queries need access to both regular fields and array fields to:

1. Determine the correct query strategy (array vs regular field)
2. Generate proper SQL/MongoDB queries
3. Handle mixed data type scenarios correctly

#### 4.2 Server Helper Integration

Update all obj helper functions to fetch and pass both fields and array fields:

- `getManyObjs()`: Fetch both `fields` and `arrayFields`, pass to storage
- `updateManyObjs()`: Fetch both `fields` and `arrayFields`, pass to storage
- `deleteManyObjs()`: Fetch both `fields` and `arrayFields`, pass to storage
- `setManyObjs()`: Fetch both `fields` and `arrayFields` for conflict resolution queries
- All other obj functions that generate queries

**Implementation Pattern**:

```typescript
// Fetch both regular fields and array fields
const fields = await getObjFields({ appId, tag });
const arrayFields = await getObjArrayFields({ appId, tag });

// Convert to Maps for O(1) lookup
const fieldsMap = new Map(fields.map((f) => [f.field, f]));
const arrayFieldsMap = new Map(arrayFields.map((f) => [f.field, f]));

// Pass to storage layer
await storage.read({
  query,
  fields: fieldsMap,
  arrayFields: arrayFieldsMap,
  // ... other params
});
```

#### 4.3 Indexing Integration

Update `indexObjs()` to:

- Extract array fields during indexing
- Store array fields in `objArrayFields` table
- Handle array field updates when objects are re-indexed

### 5. Performance Optimizations

#### 5.1 Use Maps for O(1) Lookups

Convert existing fields parameter passed to read objs for sorting to Map for performance gain:

```typescript
// Instead of array.find()
const fieldsMap = new Map(fields.map((f) => [f.field, f]));

// Use for O(1) lookup
const field = fieldsMap.get(fieldName);
```

#### 5.2 Caching Strategy

- Cache array field metadata per app/group/tag combination
- Use LRU cache for frequently accessed array field definitions
- Invalidate cache when array fields are updated

### 6. Mixed Data Type Handling

The query generation should recognize cases where a nested field has multiple value types. For example:

- obj1 has `a.b` as an array of objects with a `c` field
- obj2 has `a.b.c` as a number

To handle this, we need to:

1. Query the `IObjField` table to get field metadata
2. Pass both regular fields and array fields separately to query generation
3. Let the query generator decide which approach to use based on context

### 7. Testing Strategy

#### 7.1 Unit Tests

- Test array field extraction logic in `indexObjs`
- Test query generation for various array scenarios in storage layers
- Test edge cases (empty arrays, mixed types, deep nesting)

#### 7.2 Integration Tests

- Test end-to-end array field queries in all obj functions (read, update, delete)
- Test performance with large datasets
- Test cross-storage compatibility (Postgres vs MongoDB)

#### 7.3 Specific Test Cases

```typescript
describe("Array Field Queries", () => {
  it("should query reportsTo.userId when reportsTo is array of objects", async () => {
    // Test the primary use case from monitor
  });

  it("should handle mixed array and scalar fields", async () => {
    // Test case where same path has both array and scalar values
  });

  it("should handle deeply nested array fields", async () => {
    // Test logsQuery.and.0.op.0.subOp
  });

  it("should handle empty arrays gracefully", async () => {
    // Test queries on empty arrays
  });

  it("should handle array of primitives", async () => {
    // Test queries on arrays of strings/numbers
  });
});
```

### 8. Primary Use Case Support

This implementation primarily supports the monitor use case where:

- `reportsTo` is an array of objects with `userId` field
- Queries like `"reportsTo.userId"` should work intelligently
- The query generator should know that `userId` is a sub-object of an array `reportsTo`
- This should scale to deeper nested fields like `reportsTo.0.userId` or `reportsTo.0.permissions.0.name`

### 9. Implementation Priority

1. **Phase 1**: Array field detection and storage in `indexObjs`
2. **Phase 2**: Postgres query generation enhancement in `PostgresQueryTransformer`
3. **Phase 3**: MongoDB query enhancement in `MongoQueryTransformer`
4. **Phase 4**: Integration in all obj functions (getManyObjs, updateManyObjs, etc.)
5. **Phase 5**: Testing and performance optimization

### 10. Gotchas and Considerations

1. **Mixed Data Types**: Handle cases where the same path can be both array and scalar
2. **Performance**: Array queries can be expensive; need proper indexing
3. **Backward Compatibility**: Ensure existing queries continue to work
4. **Memory Usage**: Array field metadata can grow large; implement proper cleanup
5. **Query Complexity**: Complex array queries might need query plan analysis
6. **Data Consistency**: Ensure array field metadata stays in sync with actual data

## Hybrid Dynamic Detection Enhancement

### Overview

While the primary approach uses pre-indexed array field metadata for optimal performance, there are scenarios where dynamic detection using `jsonb_path_exists` can be beneficial as a fallback or enhancement.

### When to Use Dynamic Detection

1. **Fallback for Unknown Fields**: When array field metadata is missing or incomplete
2. **Mixed Data Type Scenarios**: When the same path can be both array and scalar in different objects
3. **Ad-hoc Queries**: For one-off queries where pre-indexing isn't available
4. **Development/Testing**: For rapid prototyping without full indexing setup

### Implementation Strategy

```typescript
private generateHybridArrayQuery(
  field: string,
  operation: string,
  value: any,
  arrayFields?: Map<string, IObjArrayField>
): ReturnType<typeof sql> {
  // First, try pre-indexed approach
  const arrayField = this.findArrayField(field, arrayFields);
  if (arrayField) {
    return this.generateArrayQuery(field, operation, value, arrayField);
  }

  // Fallback to dynamic detection for mixed types
  return this.generateDynamicArrayQuery(field, operation, value);
}

private generateDynamicArrayQuery(
  field: string,
  operation: string,
  value: any
): ReturnType<typeof sql> {
  const segments = field.split('.');

  // Generate path expressions for both array and scalar access
  const arrayPath = this.buildArrayPathExpression(segments);
  const scalarPath = this.buildScalarPathExpression(segments);

  switch (operation) {
    case 'eq':
      return sql`(
        jsonb_path_exists(obj_record, ${arrayPath}) OR
        jsonb_path_exists(obj_record, ${scalarPath})
      )`;
    // ... other operations
  }
}

private buildArrayPathExpression(segments: string[]): string {
  // Convert "a.b.c.d" to "$.a.b[*].c.d"
  const pathParts = [];
  for (let i = 0; i < segments.length; i++) {
    if (i === segments.length - 1) {
      pathParts.push(`$.${segments[i]}`);
    } else {
      pathParts.push(`$.${segments[i]}[*]`);
    }
  }
  return `'${pathParts.join('.')} == "${value}"'`;
}
```

### Performance Considerations

1. **Use Sparingly**: Dynamic detection should be a fallback, not the primary method
2. **Cache Results**: Cache dynamic detection results for repeated queries
3. **Index Hints**: Use GIN indexes on JSONB columns to improve `jsonb_path_exists` performance
4. **Query Complexity**: Limit the depth of dynamic detection to prevent exponential complexity

### Limitations

1. **Deep Nesting**: Complex nested arrays become unmanageable with dynamic detection
2. **Performance**: `jsonb_path_exists` can be slower than pre-indexed approaches
3. **Query Plan Issues**: Complex path expressions may confuse the query planner
4. **Maintenance**: Dynamic queries are harder to debug and optimize

### Recommended Approach

1. **Primary**: Use pre-indexed array field metadata for known array fields
2. **Secondary**: Use dynamic detection only for mixed data type scenarios
3. **Fallback**: Use dynamic detection when array field metadata is unavailable
4. **Monitoring**: Track performance and fallback to pre-indexed approach when possible

## Not Yet Implemented

1. **Mixed Data Type Handling**
   - The query generator does not yet handle cases where a path is both array and scalar in different objects (see "Mixed Data Type Handling" in the spec).
2. **Caching**
   - No LRU or per-app/group/tag cache for array field metadata.
3. **Cleanup/Memory Management**
   - No cleanup of unused array field metadata.
4. **Testing**
   - No new unit or integration tests have been added.
5. **Performance Optimizations**
   - No explicit cache invalidation or advanced query plan analysis.
6. **Edge Cases**
   - No explicit handling for empty arrays, deeply nested arrays, or arrays of primitives in query generation.
7. **Backward Compatibility**
   - No explicit migration or fallback for existing data.
8. **Server Helper Integration**
   - Not all server helpers (e.g., setManyObjs) may be updated; only the main ones were addressed.
9. **Drizzle/ORM Integration**
   - Only SQLite and Postgres code paths were updated; if you have other DBs, those need similar changes.

## Next Steps

- Add tests for array field extraction and query generation.
- Implement mixed data type handling.
- Add caching and cleanup for array field metadata.
- Review all server helpers for full integration.
- Monitor performance and optimize as needed.
