# Object Tests - Test Isolation Guide

This directory contains integration tests for the object storage operations. The tests have been configured to run in isolation to prevent conflicts when running multiple test files together.

## Test Isolation Strategy

### 1. Unique Identifiers

Each test file uses unique `appId` and `tag` combinations to prevent data conflicts:

- `updateObjs.test.ts`: `test-app-updateObjs` / `test-tag-updateObjs`
- `setObjs.test.ts`: `test-app-setObjs` / `test-tag-setObjs`
- `deleteObjs.test.ts`: `test-app-deleteObjs` / `test-tag-deleteObjs`
- `getObjs.test.ts`: `test-app-getObjs` / `test-tag-getObjs`
- `indexObjs.test.ts`: `test-app-indexObjs` / `test-tag-indexObjs`
- `getObjFields.test.ts`: `test-app-getObjFields` / `test-tag-getObjFields`

### 2. Database Cleanup

Each test file includes proper cleanup in `beforeEach` hooks:

- MongoDB: Deletes test data by `appId` and `tag`
- PostgreSQL: Deletes test data by `appId` and `tag`
- SQLite: Cleans up `objFields` table entries

### 3. Connection Management

- MongoDB connections are properly closed in `afterAll` hooks
- Each test creates its own storage instance

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Individual Test Files

```bash
# Run specific test file
npm test updateObjs.test.ts

# Run with specific backend
npm test -- --grep "MongoDB"
```

### Run Tests in Parallel

The tests are designed to run in parallel without conflicts:

```bash
npm test -- --reporter=verbose
```

## Test Configuration

Use the `testConfig.ts` file for consistent test identifiers:

```typescript
import { TEST_CONFIG } from "./testConfig";

const { appId, tag, groupId } = TEST_CONFIG.updateObjs;
```

## Common Issues and Solutions

### 1. Tests Fail When Run Together

- **Cause**: Shared database state between tests
- **Solution**: Ensure each test uses unique identifiers and proper cleanup

### 2. MongoDB Connection Issues

- **Cause**: Connection not properly closed between tests
- **Solution**: Check that `afterAll` hooks properly close connections

### 3. SQLite Database Conflicts

- **Cause**: Shared SQLite database between tests
- **Solution**: Each test should clean up its own data in `beforeEach`

## Adding New Tests

When adding new test files:

1. Add unique identifiers to `testConfig.ts`
2. Use the unique identifiers in your test file
3. Implement proper cleanup in `beforeEach`
4. Ensure proper connection cleanup in `afterAll`

Example:

```typescript
import { TEST_CONFIG } from "./testConfig";

const { appId, tag, groupId } = TEST_CONFIG.yourNewTest;

beforeEach(async () => {
  // Clean up test data
  await model.deleteMany({ appId, tag });
});
```

## Test Backends

The tests support multiple backends:

- **MongoDB**: Primary backend, fully tested
- **PostgreSQL**: Secondary backend, some tests may be disabled

To enable PostgreSQL tests, uncomment the PostgreSQL backend in the `backends` array.
