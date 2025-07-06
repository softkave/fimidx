# Test Isolation Fixes

This directory contains fixes for test isolation issues. The main problems were:

## Issues Identified

1. **Shared Database Connections**: All tests were sharing the same database connection instances
2. **Global Test Counter**: Each test file had its own `testCounter` but they weren't isolated between test files
3. **Incomplete Cleanup**: Some tests didn't clean up all related data (groups, permissions, etc.)
4. **Race Conditions**: Tests running in parallel could interfere with each other

## Solution

### 1. Test Utilities (`testUtils.ts`)

Created a centralized test utility that provides:

- Global unique test ID generation
- Isolated storage instances per test suite
- Comprehensive cleanup functions
- Helper functions for creating unique test data

### 2. Updated Test Files

The following test files have been updated to use the new pattern:

- ✅ `getMemberRequests.test.ts` - Updated to use `createTestSetup`
- ✅ `addMember.test.ts` - Updated to use `createTestSetup`

### 3. Pattern to Apply to Other Test Files

For each test file, replace the current pattern:

```typescript
// OLD PATTERN
const defaultAppId = "test-app-name";
const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

let testCounter = 0;

function makeAddMemberArgs(overrides: any = {}) {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    name: `Test Member ${uniqueId}`,
    appId: defaultAppId,
    groupId: defaultGroupId,
    // ... other fields
    ...overrides,
  };
}

describe("test name", () => {
  let storage: IObjStorage;

  beforeAll(async () => {
    storage = createDefaultStorage();
  });

  beforeEach(async () => {
    // Manual cleanup code
  });
});
```

With the new pattern:

```typescript
// NEW PATTERN
import { createTestSetup, makeTestData } from "./testUtils.js";

describe("test name", () => {
  const { storage, cleanup, testData } = createTestSetup({
    testName: "testName",
  });

  const { appId, groupId, by, byType } = testData;

  function makeAddMemberArgs(overrides: any = {}) {
    const testData = makeTestData({ testName: "member" });
    return {
      name: testData.name,
      appId,
      groupId,
      // ... other fields
      ...overrides,
    };
  }

  beforeAll(async () => {
    // Storage is already created by createTestSetup
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });
});
```

### 4. Files to Update

The following test files still need to be updated:

- [ ] `deleteMembers.test.ts`
- [ ] `getMembers.test.ts`
- [ ] `checkMemberPermissions.test.ts`
- [ ] `updateMemberSendEmailStatus.test.ts`
- [ ] `updateMemberPermissions.test.ts`
- [ ] `respondToMemberRequest.test.ts`
- [ ] `addMemberPermissions.test.ts`
- [ ] `updateMembers.test.ts`

### 5. Key Changes

1. **Remove global variables**: `defaultAppId`, `defaultGroupId`, `defaultBy`, `defaultByType`, `testCounter`
2. **Use `createTestSetup`**: Provides isolated storage and cleanup
3. **Use `makeTestData`**: Generates unique test data
4. **Replace manual cleanup**: Use the provided `cleanup()` function
5. **Update all references**: Replace `defaultBy` with `by`, `defaultByType` with `byType`, etc.

### 6. Benefits

- ✅ Tests are completely isolated
- ✅ No shared state between test files
- ✅ Automatic cleanup of all related data
- ✅ Unique identifiers prevent conflicts
- ✅ Consistent pattern across all tests
- ✅ Easier to maintain and debug

### 7. Running Tests

After applying these fixes, you can run tests individually or together without interference:

```bash
# Run individual test files
npm test getMemberRequests.test.ts
npm test addMember.test.ts

# Run all tests together
npm test
```
