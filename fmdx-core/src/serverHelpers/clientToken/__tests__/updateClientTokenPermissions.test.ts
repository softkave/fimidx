import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addClientToken } from "../addClientToken.js";
import { addClientTokenPermissions } from "../addClientTokenPermissions.js";
import { updateClientTokenPermissions } from "../updateClientTokenPermissions.js";

const defaultAppId = "test-app-updateClientTokenPermissions";
const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

// Test counter to ensure unique names
let testCounter = 0;

function makeAddClientTokenArgs(overrides: any = {}) {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    name: `Test Token ${uniqueId}`,
    description: "Test description",
    appId: defaultAppId,
    permissions: [],
    ...overrides,
  };
}

function makeUpdateClientTokenPermissionsArgs(overrides: any = {}) {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    query: {
      id: `token-${uniqueId}`,
      groupId: defaultGroupId,
      appId: defaultAppId,
    },
    update: {
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
      ],
    },
    ...overrides,
  };
}

describe("updateClientTokenPermissions integration", () => {
  let storage: IObjStorage;
  let cleanup: (() => Promise<void>) | undefined;

  beforeAll(async () => {
    storage = createDefaultStorage();

    if (
      process.env.FMDX_STORAGE_TYPE === "mongo" ||
      !process.env.FMDX_STORAGE_TYPE
    ) {
      cleanup = async () => {
        // Cleanup will be handled by the storage interface
      };
    }
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  beforeEach(async () => {
    try {
      const testAppIds = [
        defaultAppId,
        "test-app-updateClientTokenPermissions-1",
        "test-app-updateClientTokenPermissions-2",
      ];
      for (const appId of testAppIds) {
        await storage.bulkDelete({
          query: { appId },
          tag: kObjTags.clientToken,
          deletedBy: defaultBy,
          deletedByType: defaultByType,
          deleteMany: true,
          hardDelete: true,
        });
        await storage.bulkDelete({
          query: { appId },
          tag: kObjTags.permission,
          deletedBy: defaultBy,
          deletedByType: defaultByType,
          deleteMany: true,
          hardDelete: true,
        });
      }
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  afterEach(async () => {
    try {
      const testAppIds = [
        defaultAppId,
        "test-app-updateClientTokenPermissions-1",
        "test-app-updateClientTokenPermissions-2",
      ];
      for (const appId of testAppIds) {
        await storage.bulkDelete({
          query: { appId },
          tag: kObjTags.clientToken,
          deletedBy: defaultBy,
          deletedByType: defaultByType,
          deleteMany: true,
          hardDelete: true,
        });
        await storage.bulkDelete({
          query: { appId },
          tag: kObjTags.permission,
          deletedBy: defaultBy,
          deletedByType: defaultByType,
          deleteMany: true,
          hardDelete: true,
        });
      }
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  it("updates permissions for a client token successfully", async () => {
    // First create a client token
    const tokenArgs = makeAddClientTokenArgs();
    const token = await addClientToken({
      args: tokenArgs,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Add initial permissions
    await addClientTokenPermissions({
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      appId: defaultAppId,
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
      ],
      clientTokenId: token.clientToken.id,
      storage,
    });

    // Update permissions
    const updateArgs = makeUpdateClientTokenPermissionsArgs({
      query: {
        id: token.clientToken.id,
        groupId: defaultGroupId,
        appId: defaultAppId,
      },
      update: {
        permissions: [
          {
            entity: "admin",
            action: "write",
            target: "settings",
          },
          {
            entity: "user",
            action: "delete",
            target: "document",
          },
        ],
      },
    });

    const result = await updateClientTokenPermissions({
      args: updateArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result.clientToken).toBeDefined();
    expect(result.clientToken.permissions).toBeDefined();
    expect(result.clientToken.permissions).toHaveLength(2);

    // Verify the updated permissions
    const permission1 = result.clientToken.permissions![0];
    const permission2 = result.clientToken.permissions![1];

    expect(permission1.entity).toBe("admin");
    expect(permission1.action).toBe("write");
    expect(permission1.target).toBe("settings");

    expect(permission2.entity).toBe("user");
    expect(permission2.action).toBe("delete");
    expect(permission2.target).toBe("document");
  });

  it("throws error when client token not found", async () => {
    const updateArgs = makeUpdateClientTokenPermissionsArgs({
      query: {
        id: "non-existent-token",
        groupId: defaultGroupId,
        appId: defaultAppId,
      },
      update: {
        permissions: [
          {
            entity: "user",
            action: "read",
            target: "document",
          },
        ],
      },
    });

    await expect(
      updateClientTokenPermissions({
        args: updateArgs,
        by: defaultBy,
        byType: defaultByType,
        storage,
      })
    ).rejects.toThrow("Client token not found");
  });

  it("handles empty permissions array", async () => {
    // First create a client token
    const tokenArgs = makeAddClientTokenArgs();
    const token = await addClientToken({
      args: tokenArgs,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Add initial permissions
    await addClientTokenPermissions({
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      appId: defaultAppId,
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
      ],
      clientTokenId: token.clientToken.id,
      storage,
    });

    // Update with empty permissions
    const updateArgs = makeUpdateClientTokenPermissionsArgs({
      query: {
        id: token.clientToken.id,
        groupId: defaultGroupId,
        appId: defaultAppId,
      },
      update: {
        permissions: [],
      },
    });

    const result = await updateClientTokenPermissions({
      args: updateArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result.clientToken).toBeDefined();
    expect(result.clientToken.permissions).toBeDefined();
    expect(result.clientToken.permissions).toHaveLength(0);
  });

  it("handles complex permission objects", async () => {
    // First create a client token
    const tokenArgs = makeAddClientTokenArgs();
    const token = await addClientToken({
      args: tokenArgs,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Update with complex permission objects
    const updateArgs = makeUpdateClientTokenPermissionsArgs({
      query: {
        id: token.clientToken.id,
        groupId: defaultGroupId,
        appId: defaultAppId,
      },
      update: {
        permissions: [
          {
            entity: { type: "user", id: "123" },
            action: { operation: "read", scope: "full" },
            target: { resource: "document", id: "456" },
          },
        ],
      },
    });

    const result = await updateClientTokenPermissions({
      args: updateArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(result.clientToken).toBeDefined();
    expect(result.clientToken.permissions).toBeDefined();
    expect(result.clientToken.permissions).toHaveLength(1);

    const permission = result.clientToken.permissions![0];
    expect(permission.entity).toEqual({ type: "user", id: "123" });
    expect(permission.action).toEqual({ operation: "read", scope: "full" });
    expect(permission.target).toEqual({ resource: "document", id: "456" });
  });
});
