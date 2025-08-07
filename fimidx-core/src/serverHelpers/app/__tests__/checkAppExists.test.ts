import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { kObjTags } from "../../../definitions/obj.js";
import { kId0 } from "../../../definitions/system.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addApp } from "../addApp.js";
import { checkAppAvailable, checkAppExists } from "../checkAppExists.js";

const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

// Test counter to ensure unique names
let testCounter = 0;

function makeAddAppArgs(overrides: any = {}) {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    name: `Test App ${uniqueId}`,
    description: "Test app description",
    groupId: defaultGroupId,
    objFieldsToIndex: ["field1", "field2"],
    ...overrides,
  };
}

// Helper function to create apps with specific names for testing
function makeTestAppArgs(name: string, overrides: any = {}) {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    name: `${name}_${uniqueId}`,
    description: "Test app description",
    groupId: defaultGroupId,
    objFieldsToIndex: ["field1", "field2"],
    ...overrides,
  };
}

describe("checkAppExists integration", () => {
  let storage: IObjStorage;

  beforeAll(async () => {
    // Test will use the default storage type from createDefaultStorage()
    storage = createDefaultStorage();
  });

  beforeEach(async () => {
    // Clean up test data before each test using hard deletes for complete isolation
    try {
      await storage.bulkDelete({
        query: { appId: kId0 },
        tag: kObjTags.app,
        deletedBy: defaultBy,
        deletedByType: defaultByType,
        deleteMany: true,
        hardDelete: true, // Use hard delete for test cleanup
      });
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  afterEach(async () => {
    // Clean up after each test using hard deletes for complete isolation
    try {
      await storage.bulkDelete({
        query: { appId: kId0 },
        tag: kObjTags.app,
        deletedBy: defaultBy,
        deletedByType: defaultByType,
        deleteMany: true,
        hardDelete: true, // Use hard delete for test cleanup
      });
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  it("returns exists: false when app does not exist", async () => {
    const result = await checkAppExists({
      name: "Non-existent App",
      groupId: defaultGroupId,
    });

    expect(result.exists).toBe(false);
    expect(result.isId).toBe(false);
  });

  it("returns exists: true when app exists by name", async () => {
    // Create an app first
    const appArgs = makeAddAppArgs({ name: "Existing App" });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const result = await checkAppExists({
      name: appArgs.name,
      groupId: defaultGroupId,
    });

    expect(result.exists).toBe(true);
    expect(result.isId).toBe(false);
  });

  it("returns exists: true and isId: true when app exists and isId matches", async () => {
    // Create an app first
    const appArgs = makeAddAppArgs({ name: "Test App" });
    const createdApp = await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(createdApp.app).toBeDefined();

    const checkResult = await checkAppExists({
      name: appArgs.name,
      isId: createdApp.app.id,
      groupId: defaultGroupId,
    });

    expect(checkResult.exists).toBe(true);
    expect(checkResult.isId).toBe(true);
  });

  it("returns exists: true and isId: false when app exists but isId does not match", async () => {
    // Create an app first
    const appArgs = makeAddAppArgs({ name: "Test App" });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const checkResult = await checkAppExists({
      name: appArgs.name,
      isId: "different-id",
      groupId: defaultGroupId,
    });

    expect(checkResult.exists).toBe(true);
    expect(checkResult.isId).toBe(false);
  });

  it("does not find app with same name in different group", async () => {
    // Create an app in one group
    const appArgs = makeAddAppArgs({
      name: "Shared Name App",
      groupId: "group-1",
    });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Check for app with same name in different group
    const result = await checkAppExists({
      name: appArgs.name,
      groupId: "group-2",
    });

    expect(result.exists).toBe(false);
    expect(result.isId).toBe(false);
  });

  it("finds app with same name in correct group", async () => {
    // Create an app in one group
    const appArgs = makeAddAppArgs({
      name: "Shared Name App",
      groupId: "group-1",
    });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Check for app with same name in correct group
    const result = await checkAppExists({
      name: appArgs.name,
      groupId: "group-1",
    });

    expect(result.exists).toBe(true);
    expect(result.isId).toBe(false);
  });

  it("handles case-sensitive name matching", async () => {
    // Create an app with specific case
    const appArgs = makeAddAppArgs({ name: "TestApp" });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Check with same case
    const result = await checkAppExists({
      name: appArgs.name,
      groupId: defaultGroupId,
    });

    expect(result.exists).toBe(true);
    expect(result.isId).toBe(false);
  });

  it("handles apps with special characters in names", async () => {
    // Create an app with special characters
    const appArgs = makeAddAppArgs({
      name: "App with special chars: !@#$%^&*()",
    });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Check for app with special characters
    const result = await checkAppExists({
      name: appArgs.name,
      groupId: defaultGroupId,
    });

    expect(result.exists).toBe(true);
    expect(result.isId).toBe(false);
  });

  it("handles apps with very long names", async () => {
    const longName = "A".repeat(1000);

    // Create an app with long name
    const appArgs = makeAddAppArgs({ name: longName });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Check for app with long name
    const result = await checkAppExists({
      name: appArgs.name,
      groupId: defaultGroupId,
    });

    expect(result.exists).toBe(true);
    expect(result.isId).toBe(false);
  });

  it("handles apps with empty string names", async () => {
    // Create an app with empty name
    const appArgs = makeAddAppArgs({ name: "" });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Check for app with empty name
    const result = await checkAppExists({
      name: appArgs.name,
      groupId: defaultGroupId,
    });

    expect(result.exists).toBe(true);
    expect(result.isId).toBe(false);
  });

  it("handles multiple apps with same name in different groups", async () => {
    // Create apps with same name in different groups
    const app1Args = makeAddAppArgs({
      name: "Shared Name",
      groupId: "group-1",
    });
    const app2Args = makeAddAppArgs({
      name: "Shared Name",
      groupId: "group-2",
    });

    await addApp({
      args: app1Args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    await addApp({
      args: app2Args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Check for app in group-1
    const result1 = await checkAppExists({
      name: app1Args.name,
      groupId: "group-1",
    });

    expect(result1.exists).toBe(true);
    expect(result1.isId).toBe(false);

    // Check for app in group-2
    const result2 = await checkAppExists({
      name: app2Args.name,
      groupId: "group-2",
    });

    expect(result2.exists).toBe(true);
    expect(result2.isId).toBe(false);
  });

  it("handles apps created by different users", async () => {
    // Create an app by a specific user
    const appArgs = makeAddAppArgs({ name: "User App" });
    await addApp({
      args: appArgs,
      by: "user1",
      byType: "user",
      storage,
    });

    // Check for app (should find it regardless of creator)
    const result = await checkAppExists({
      name: "User App",
      groupId: defaultGroupId,
    });

    expect(result.exists).toBe(true);
    expect(result.isId).toBe(false);
  });

  it("handles concurrent app creation and checking", async () => {
    // Create multiple apps concurrently
    const promises = Array.from({ length: 5 }, (_, i) =>
      addApp({
        args: makeAddAppArgs({ name: `Concurrent App ${i}` }),
        by: defaultBy,
        byType: defaultByType,
        storage,
      })
    );

    await Promise.all(promises);

    // Check for each app
    const checkPromises = Array.from({ length: 5 }, (_, i) =>
      checkAppExists({
        name: `Concurrent App ${i}`,
        groupId: defaultGroupId,
      })
    );

    const results = await Promise.all(checkPromises);

    results.forEach((result) => {
      expect(result.exists).toBe(true);
      expect(result.isId).toBe(false);
    });
  });
});

describe("checkAppAvailable integration", () => {
  let storage: IObjStorage;

  beforeAll(async () => {
    // Test will use the default storage type from createDefaultStorage()
    storage = createDefaultStorage();
  });

  beforeEach(async () => {
    // Clean up test data before each test using hard deletes for complete isolation
    try {
      await storage.bulkDelete({
        query: { appId: kId0 },
        tag: kObjTags.app,
        deletedBy: defaultBy,
        deletedByType: defaultByType,
        deleteMany: true,
        hardDelete: true, // Use hard delete for test cleanup
      });
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  afterEach(async () => {
    // Clean up after each test using hard deletes for complete isolation
    try {
      await storage.bulkDelete({
        query: { appId: kId0 },
        tag: kObjTags.app,
        deletedBy: defaultBy,
        deletedByType: defaultByType,
        deleteMany: true,
        hardDelete: true, // Use hard delete for test cleanup
      });
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  it("returns available: true when app does not exist", async () => {
    const result = await checkAppAvailable({
      name: "Non-existent App",
      groupId: defaultGroupId,
    });

    expect(result.available).toBe(true);
  });

  it("returns available: false when app exists", async () => {
    // Create an app first
    const appArgs = makeAddAppArgs({ name: "Existing App" });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // checkAppAvailable should throw an error when app exists
    await expect(
      checkAppAvailable({
        name: appArgs.name,
        groupId: defaultGroupId,
      })
    ).rejects.toThrow("App already exists");
  });

  it("returns available: true when app does not exist", async () => {
    const result = await checkAppAvailable({
      name: "Available App",
      groupId: defaultGroupId,
    });

    expect(result.available).toBe(true);
  });

  it("does not find app with same name in different group", async () => {
    // Create an app in one group
    const appArgs = makeAddAppArgs({
      name: "Shared Name App",
      groupId: "group-1",
    });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Check for app with same name in different group
    const result = await checkAppAvailable({
      name: appArgs.name,
      groupId: "group-2",
    });

    expect(result.available).toBe(true);
  });

  it("finds app with same name in correct group", async () => {
    // Create an app in one group
    const appArgs = makeAddAppArgs({
      name: "Shared Name App",
      groupId: "group-1",
    });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Check for app with same name in correct group - should throw error
    await expect(
      checkAppAvailable({
        name: appArgs.name,
        groupId: "group-1",
      })
    ).rejects.toThrow("App already exists");
  });

  it("handles case-sensitive name matching", async () => {
    // Create an app with specific case
    const appArgs = makeAddAppArgs({ name: "TestApp" });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Check with same case - should throw error
    await expect(
      checkAppAvailable({
        name: appArgs.name,
        groupId: defaultGroupId,
      })
    ).rejects.toThrow("App already exists");
  });

  it("handles apps with special characters in names", async () => {
    // Create an app with special characters
    const appArgs = makeAddAppArgs({
      name: "App with special chars: !@#$%^&*()",
    });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Check for app with special characters - should throw error
    await expect(
      checkAppAvailable({
        name: appArgs.name,
        groupId: defaultGroupId,
      })
    ).rejects.toThrow("App already exists");
  });

  it("handles apps with very long names", async () => {
    const longName = "A".repeat(1000);

    // Create an app with long name
    const appArgs = makeAddAppArgs({ name: longName });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Check for app with long name - should throw error
    await expect(
      checkAppAvailable({
        name: appArgs.name,
        groupId: defaultGroupId,
      })
    ).rejects.toThrow("App already exists");
  });

  it("handles apps with empty string names", async () => {
    // Create an app with empty name
    const appArgs = makeAddAppArgs({ name: "" });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Check for app with empty name - should throw error
    await expect(
      checkAppAvailable({
        name: appArgs.name,
        groupId: defaultGroupId,
      })
    ).rejects.toThrow("App already exists");
  });
});
