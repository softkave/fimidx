import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { DeleteClientTokensEndpointArgs } from "../../../definitions/clientToken.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addClientToken } from "../addClientToken.js";
import { deleteClientTokens } from "../deleteClientTokens.js";
import { getClientTokens } from "../getClientTokens.js";

const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";
const defaultAppId = "test-app";

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

describe("deleteClientTokens integration", () => {
  let storage: IObjStorage;
  let cleanup: (() => Promise<void>) | undefined;

  async function createTestToken(name: string, overrides: any = {}) {
    const args = makeAddClientTokenArgs({
      name,
      ...overrides,
    });

    const result = await addClientToken({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    return result.clientToken;
  }

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
    // Clean up test data before each test
    try {
      await storage.bulkDelete({
        query: { appId: defaultAppId },
        tag: kObjTags.clientToken,
        deletedBy: defaultBy,
        deletedByType: defaultByType,
        deleteMany: true,
        hardDelete: true,
      });
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await storage.bulkDelete({
        query: { appId: defaultAppId },
        tag: kObjTags.clientToken,
        deletedBy: defaultBy,
        deletedByType: defaultByType,
        deleteMany: true,
        hardDelete: true,
      });
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  it("deletes a single token by name", async () => {
    // Create a test token
    const token = await createTestToken("Token to Delete");

    const args: DeleteClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        name: {
          eq: "Token to Delete",
        },
      },
      deleteMany: false,
    };

    await deleteClientTokens({
      ...args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the token was deleted
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(0);
  });

  it("deletes multiple tokens when deleteMany is true", async () => {
    // Create multiple test tokens
    await createTestToken("Token 1", { meta: { type: "user" } });
    await createTestToken("Token 2", { meta: { type: "user" } });
    await createTestToken("Token 3", { meta: { type: "admin" } });

    const args: DeleteClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        meta: [
          {
            op: "eq",
            field: "type",
            value: "user",
          },
        ],
      },
      deleteMany: true,
    };

    await deleteClientTokens({
      ...args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only user tokens were deleted
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(1);
    expect(result.clientTokens[0].meta?.type).toBe("admin");
  });

  it("deletes only one token when deleteMany is false", async () => {
    // Create multiple test tokens
    await createTestToken("Token 1", { meta: { type: "user" } });
    await createTestToken("Token 2", { meta: { type: "user" } });

    const args: DeleteClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        meta: [
          {
            op: "eq",
            field: "type",
            value: "user",
          },
        ],
      },
      deleteMany: false,
    };

    await deleteClientTokens({
      ...args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only one token was deleted
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(1);
  });

  it("deletes token by id", async () => {
    // Create a test token
    const token = await createTestToken("Test Token");

    const args: DeleteClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        id: {
          eq: token.id,
        },
      },
      deleteMany: false,
    };

    await deleteClientTokens({
      ...args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the token was deleted
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(0);
  });

  it("deletes tokens by createdBy", async () => {
    // Create test tokens
    await createTestToken("Token 1");
    await createTestToken("Token 2");

    const args: DeleteClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        createdBy: {
          eq: defaultBy,
        },
      },
      deleteMany: true,
    };

    await deleteClientTokens({
      ...args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify all tokens were deleted
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(0);
  });

  it("deletes tokens by multiple criteria", async () => {
    // Create tokens with different characteristics
    await createTestToken("Admin Token", {
      meta: { type: "admin", status: "active" },
    });
    await createTestToken("User Token", {
      meta: { type: "user", status: "active" },
    });
    await createTestToken("Admin Token 2", {
      meta: { type: "admin", status: "inactive" },
    });

    const args: DeleteClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        meta: [
          {
            op: "eq",
            field: "type",
            value: "admin",
          },
          {
            op: "eq",
            field: "status",
            value: "active",
          },
        ],
      },
      deleteMany: true,
    };

    await deleteClientTokens({
      ...args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only admin tokens with active status were deleted
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(2);
    expect(
      result.clientTokens.every(
        (t) => !(t.meta?.type === "admin" && t.meta?.status === "active")
      )
    ).toBe(true);
  });

  it("deletes tokens across different apps", async () => {
    // Create tokens in different apps
    await createTestToken("Token 1", { appId: "app1" });
    await createTestToken("Token 2", { appId: "app2" });

    const args: DeleteClientTokensEndpointArgs = {
      query: {
        appId: "app1",
        name: {
          eq: "Token 1",
        },
      },
      deleteMany: false,
    };

    await deleteClientTokens({
      ...args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only the token in app1 was deleted
    const result1 = await getClientTokens({
      args: {
        query: {
          appId: "app1",
        },
      },
      storage,
    });

    const result2 = await getClientTokens({
      args: {
        query: {
          appId: "app2",
        },
      },
      storage,
    });

    expect(result1.clientTokens).toHaveLength(0);
    expect(result2.clientTokens).toHaveLength(1);
  });

  it("deletes tokens by name pattern", async () => {
    // Create tokens with different names
    await createTestToken("Admin Token 1");
    await createTestToken("Admin Token 2");
    await createTestToken("User Token 1");

    const args: DeleteClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        name: {
          in: ["Admin Token 1", "Admin Token 2"],
        },
      },
      deleteMany: true,
    };

    await deleteClientTokens({
      ...args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only admin tokens were deleted
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(1);
    expect(result.clientTokens[0].name).toBe("User Token 1");
  });

  it("deletes tokens by permissions", async () => {
    // Create tokens with different permissions
    await createTestToken("Token 1", {
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
    });
    await createTestToken("Token 2", {
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
      ],
    });
    await createTestToken("Token 3", {
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

    const args: DeleteClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        permissions: {
          in: ["read", "write"],
        },
      },
      deleteMany: true,
    };

    await deleteClientTokens({
      ...args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify tokens with read/write permissions were deleted
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(1);
    expect(result.clientTokens[0].permissions).toEqual([
      "read",
      "write",
      "delete",
    ]);
  });

  it("deletes tokens by date range", async () => {
    // Create tokens at different times
    const token1 = await createTestToken("Token 1");
    const token2 = await createTestToken("Token 2");
    const token3 = await createTestToken("Token 3");

    // Get the creation time of the second token
    const targetTime = token2.createdAt;

    const args: DeleteClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        createdAt: {
          eq: targetTime.getTime(),
        },
      },
      deleteMany: true,
    };

    await deleteClientTokens({
      ...args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only the token with matching creation time was deleted
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(2);
    expect(result.clientTokens.every((t) => t.id !== token2.id)).toBe(true);
  });

  it("handles deletion of non-existent tokens gracefully", async () => {
    const args: DeleteClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        name: {
          eq: "Non-existent Token",
        },
      },
      deleteMany: false,
    };

    // This should not throw an error
    await expect(
      deleteClientTokens({
        ...args,
        by: defaultBy,
        byType: defaultByType,
        storage,
      })
    ).resolves.not.toThrow();
  });
});
