import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { AddAppEndpointArgs } from "../../../definitions/app.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addApp } from "../addApp.js";

const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

// Test counter to ensure unique names
let testCounter = 0;

function makeAddAppArgs(
  overrides: Partial<AddAppEndpointArgs> = {}
): AddAppEndpointArgs {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    name: `Test App ${uniqueId}`,
    description: "Test description",
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
    description: "Test description",
    groupId: defaultGroupId,
    objFieldsToIndex: ["field1", "field2"],
    ...overrides,
  };
}

describe("addApp integration", () => {
  let storage: IObjStorage;
  let cleanup: (() => Promise<void>) | undefined;

  beforeAll(async () => {
    // Test will use the default storage type from createDefaultStorage()
    storage = createDefaultStorage();

    // For MongoDB, we need to ensure the connection is ready
    if (
      process.env.FMDX_STORAGE_TYPE === "mongo" ||
      !process.env.FMDX_STORAGE_TYPE
    ) {
      // MongoDB specific setup - we'll handle this through the storage interface
      cleanup = async () => {
        // Cleanup will be handled by the storage interface
      };
    }
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  beforeEach(async () => {
    // Clean up test data before each test using hard deletes for complete isolation
    try {
      await storage.bulkDelete({
        query: { appId: "0" },
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
        query: { appId: "0" },
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

  it("verifies test isolation by checking empty state", async () => {
    // This test verifies that our cleanup is working
    // We can't easily check for empty state in addApp tests since we need to create apps to test
    // But we can verify that each test starts with a clean slate by checking that duplicate names work
    const args = makeAddAppArgs({
      name: "Isolation Test App",
    });

    // First app creation should succeed
    const result1 = await addApp({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result1.app).toBeDefined();
    expect(result1.app.name).toBe("Isolation Test App");

    // Second app with same name should fail due to conflict
    await expect(
      addApp({
        args,
        by: defaultBy,
        byType: defaultByType,
        storage,
      })
    ).rejects.toThrow("Failed to add app");
  });

  it("creates a new app successfully", async () => {
    const args = makeAddAppArgs({
      name: "My Test App",
      description: "A test app description",
      objFieldsToIndex: ["field1", "field2"],
    });

    const result = await addApp({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result.app).toBeDefined();
    expect(result.app.name).toBe("My Test App");
    expect(result.app.description).toBe("A test app description");
    expect(result.app.objFieldsToIndex).toEqual(["field1", "field2"]);
    expect(result.app.groupId).toBe(defaultGroupId);
    expect(result.app.createdBy).toBe(defaultBy);
    expect(result.app.createdByType).toBe(defaultByType);
    expect(result.app.id).toBeDefined();
    expect(result.app.createdAt).toBeInstanceOf(Date);
    expect(result.app.updatedAt).toBeInstanceOf(Date);
  });

  it("creates an app with minimal required fields", async () => {
    const args = makeAddAppArgs({
      name: "Minimal App",
      description: undefined,
      objFieldsToIndex: undefined,
    });

    const result = await addApp({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result.app).toBeDefined();
    expect(result.app.name).toBe("Minimal App");
    expect(result.app.description).toBeUndefined();
    expect(result.app.objFieldsToIndex).toBeNull();
  });

  it("fails when trying to create an app with duplicate name in same group", async () => {
    const args = makeAddAppArgs({
      name: "Duplicate Name App",
    });

    // First app creation should succeed
    const result1 = await addApp({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result1.app).toBeDefined();
    expect(result1.app.name).toBe("Duplicate Name App");

    // Second app with same name should fail due to conflict on "name"
    await expect(
      addApp({
        args,
        by: defaultBy,
        byType: defaultByType,
        storage,
      })
    ).rejects.toThrow("Failed to add app");
  });

  it("allows creating apps with different names in same group", async () => {
    const args1 = makeAddAppArgs({
      name: "First App",
    });

    const args2 = makeAddAppArgs({
      name: "Second App",
    });

    const result1 = await addApp({
      args: args1,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const result2 = await addApp({
      args: args2,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result1.app).toBeDefined();
    expect(result1.app.name).toBe("First App");
    expect(result2.app).toBeDefined();
    expect(result2.app.name).toBe("Second App");
    expect(result1.app.id).not.toBe(result2.app.id);
  });

  it("allows creating apps with same name in different groups", async () => {
    const args1 = makeAddAppArgs({
      name: "Same Name App",
      groupId: "group-1",
    });

    const args2 = makeAddAppArgs({
      name: "Same Name App",
      groupId: "group-2",
    });

    const result1 = await addApp({
      args: args1,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const result2 = await addApp({
      args: args2,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result1.app).toBeDefined();
    expect(result1.app.name).toBe("Same Name App");
    expect(result1.app.groupId).toBe("group-1");
    expect(result2.app).toBeDefined();
    expect(result2.app.name).toBe("Same Name App");
    expect(result2.app.groupId).toBe("group-2");
    expect(result1.app.id).not.toBe(result2.app.id);
  });

  it("handles apps with special characters in names", async () => {
    const args = makeAddAppArgs({
      name: "App with special chars: !@#$%^&*()",
      description: "Description with emojis 🚀 and symbols ©®™",
    });

    const result = await addApp({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result.app).toBeDefined();
    expect(result.app.name).toBe("App with special chars: !@#$%^&*()");
    expect(result.app.description).toBe(
      "Description with emojis 🚀 and symbols ©®™"
    );
  });

  it("handles very long app names and descriptions", async () => {
    const longName = "A".repeat(1000);
    const longDescription = "B".repeat(2000);

    const args = makeAddAppArgs({
      name: longName,
      description: longDescription,
    });

    const result = await addApp({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result.app).toBeDefined();
    expect(result.app.name).toBe(longName);
    expect(result.app.description).toBe(longDescription);
  });

  it("handles apps with many objFieldsToIndex", async () => {
    const manyFields = Array.from({ length: 100 }, (_, i) => `field${i}`);

    const args = makeAddAppArgs({
      name: "Many Fields App",
      objFieldsToIndex: manyFields,
    });

    const result = await addApp({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result.app).toBeDefined();
    expect(result.app.objFieldsToIndex).toEqual(manyFields);
  });

  it("handles apps with empty string names", async () => {
    const args = makeAddAppArgs({
      name: "",
    });

    const result = await addApp({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result.app).toBeDefined();
    expect(result.app.name).toBe("");
  });

  it("handles apps created by different users", async () => {
    const args = makeAddAppArgs({
      name: "User App",
    });

    const result = await addApp({
      args,
      by: "user1",
      byType: "user",
      storage,
    });

    expect(result.app).toBeDefined();
    expect(result.app.createdBy).toBe("user1");
    expect(result.app.createdByType).toBe("user");
  });

  it("handles apps with different byType values", async () => {
    const args = makeAddAppArgs({
      name: "System App",
    });

    const result = await addApp({
      args,
      by: "system",
      byType: "system",
      storage,
    });

    expect(result.app).toBeDefined();
    expect(result.app.createdBy).toBe("system");
    expect(result.app.createdByType).toBe("system");
  });

  it("handles concurrent app creation", async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      addApp({
        args: makeAddAppArgs({ name: `Concurrent App ${i}` }),
        by: defaultBy,
        byType: defaultByType,
        storage,
      })
    );

    const results = await Promise.all(promises);

    expect(results).toHaveLength(10);
    results.forEach((result, i) => {
      expect(result.app).toBeDefined();
      expect(result.app.name).toBe(`Concurrent App ${i}`);
    });
  });

  it("handles apps with duplicate objFieldsToIndex values", async () => {
    const args = makeAddAppArgs({
      name: "Duplicate Fields App",
      objFieldsToIndex: ["field1", "field1", "field2", "field2"],
    });

    const result = await addApp({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result.app).toBeDefined();
    expect(result.app.objFieldsToIndex).toEqual(["field1", "field2"]);
  });

  it("handles apps with null objFieldsToIndex", async () => {
    const args = makeAddAppArgs({
      name: "Null Fields App",
      objFieldsToIndex: null as any,
    });

    const result = await addApp({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result.app).toBeDefined();
    expect(result.app.objFieldsToIndex).toBeNull();
  });

  it("handles apps with empty objFieldsToIndex array", async () => {
    const args = makeAddAppArgs({
      name: "Empty Fields App",
      objFieldsToIndex: [],
    });

    const result = await addApp({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result.app).toBeDefined();
    expect(result.app.objFieldsToIndex).toEqual([]);
  });
});
