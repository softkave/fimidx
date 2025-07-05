import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { AddClientTokenEndpointArgs } from "../../../definitions/clientToken.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addClientToken } from "../addClientToken.js";

const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";
const defaultAppId = "test-app";

// Test counter to ensure unique names
let testCounter = 0;

function makeAddClientTokenArgs(
  overrides: Partial<AddClientTokenEndpointArgs> = {}
): AddClientTokenEndpointArgs {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    name: `Test Token ${uniqueId}`,
    description: "Test description",
    appId: defaultAppId,
    meta: { key: "value" },
    permissions: [
      {
        entity: "user",
        action: "read",
        target: "document",
      },
      {
        entity: "admin",
        action: "write",
        target: "settings",
      },
    ],
    ...overrides,
  };
}

// Helper function to create tokens with specific names for testing
function makeTestTokenArgs(name: string, overrides: any = {}) {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    name: `${name}_${uniqueId}`,
    description: "Test description",
    appId: defaultAppId,
    meta: { key: "value" },
    permissions: [
      {
        entity: "user",
        action: "read",
        target: "document",
      },
      {
        entity: "admin",
        action: "write",
        target: "settings",
      },
    ],
    ...overrides,
  };
}

describe("addClientToken integration", () => {
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
        query: { appId: defaultAppId },
        tag: kObjTags.clientToken,
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
        query: { appId: defaultAppId },
        tag: kObjTags.clientToken,
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
    // We can't easily check for empty state in addClientToken tests since we need to create tokens to test
    // But we can verify that each test starts with a clean slate by checking that duplicate names work
    const args = makeAddClientTokenArgs({
      name: "Isolation Test Token",
    });

    // First token creation should succeed
    const result1 = await addClientToken({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result1.clientToken).toBeDefined();
    expect(result1.clientToken.name).toBe("Isolation Test Token");

    // Second token with same name should fail due to conflict
    await expect(
      addClientToken({
        args,
        by: defaultBy,
        byType: defaultByType,
        groupId: defaultGroupId,
        storage,
      })
    ).rejects.toThrow("Failed to add client token");
  });

  it("creates a new client token successfully", async () => {
    const args = makeAddClientTokenArgs({
      name: "My Test Token",
      description: "A test token description",
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
        {
          entity: "admin",
          action: "write",
          target: "settings",
        },
        {
          entity: "admin",
          action: "delete",
          target: "document",
        },
      ],
    });

    const result = await addClientToken({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result.clientToken).toBeDefined();
    expect(result.clientToken.name).toBe("My Test Token");
    expect(result.clientToken.description).toBe("A test token description");
    expect(result.clientToken.permissions).toHaveLength(3);
    expect(result.clientToken.permissions![0].entity).toBe("user");
    expect(result.clientToken.permissions![0].action).toBe("read");
    expect(result.clientToken.permissions![0].target).toBe("document");
    expect(result.clientToken.appId).toBe(defaultAppId);
    expect(result.clientToken.createdBy).toBe(defaultBy);
    expect(result.clientToken.createdByType).toBe(defaultByType);
    expect(result.clientToken.id).toBeDefined();
    expect(result.clientToken.createdAt).toBeInstanceOf(Date);
    expect(result.clientToken.updatedAt).toBeInstanceOf(Date);
  });

  it("creates a token with minimal required fields", async () => {
    const args = makeAddClientTokenArgs({
      name: "Minimal Token",
      description: undefined,
      meta: undefined,
      permissions: undefined,
    });

    const result = await addClientToken({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result.clientToken).toBeDefined();
    expect(result.clientToken.name).toBe("Minimal Token");
    expect(result.clientToken.description).toBeUndefined();
    expect(result.clientToken.meta).toBeUndefined();
    expect(result.clientToken.permissions).toBeNull();
  });

  it("fails when trying to create a token with duplicate name in same app", async () => {
    const args = makeAddClientTokenArgs({
      name: "Duplicate Name Token",
    });

    // First token creation should succeed
    const result1 = await addClientToken({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result1.clientToken).toBeDefined();
    expect(result1.clientToken.name).toBe("Duplicate Name Token");

    // Second token with same name should fail due to conflict
    await expect(
      addClientToken({
        args,
        by: defaultBy,
        byType: defaultByType,
        groupId: defaultGroupId,
        storage,
      })
    ).rejects.toThrow("Failed to add client token");
  });

  it("allows tokens with same name in different apps", async () => {
    const args1 = makeAddClientTokenArgs({
      name: "Same Name Token",
      appId: "app1",
    });

    const args2 = makeAddClientTokenArgs({
      name: "Same Name Token",
      appId: "app2",
    });

    // Both tokens should succeed since they're in different apps
    const result1 = await addClientToken({
      args: args1,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const result2 = await addClientToken({
      args: args2,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result1.clientToken.name).toBe("Same Name Token");
    expect(result1.clientToken.appId).toBe("app1");
    expect(result2.clientToken.name).toBe("Same Name Token");
    expect(result2.clientToken.appId).toBe("app2");
  });

  it("generates name when not provided", async () => {
    const args = makeAddClientTokenArgs({
      name: undefined,
    });

    const result = await addClientToken({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result.clientToken.name).toMatch(/^token-\d+-\d+-\d+-\d+$/);
  });

  it("handles meta field correctly", async () => {
    const meta = {
      key1: "value1",
      key2: "123",
      nested: "bar",
    };

    const args = makeAddClientTokenArgs({
      meta,
    });

    const result = await addClientToken({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result.clientToken.meta).toEqual(meta);
  });

  it("handles permissions field correctly", async () => {
    const permissions = [
      {
        entity: "user",
        action: "read",
        target: "document",
      },
      {
        entity: "admin",
        action: "write",
        target: "settings",
      },
      {
        entity: "admin",
        action: "admin",
        target: "system",
      },
    ];

    const args = makeAddClientTokenArgs({
      permissions,
    });

    const result = await addClientToken({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result.clientToken.permissions).toHaveLength(3);
    expect(result.clientToken.permissions![0].entity).toBe("user");
    expect(result.clientToken.permissions![0].action).toBe("read");
    expect(result.clientToken.permissions![0].target).toBe("document");
  });

  it("sets null permissions when not provided", async () => {
    const args = makeAddClientTokenArgs({
      permissions: undefined,
    });

    const result = await addClientToken({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result.clientToken.permissions).toBeNull();
  });
});
