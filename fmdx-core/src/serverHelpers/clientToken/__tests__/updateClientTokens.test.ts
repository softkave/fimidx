import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { UpdateClientTokensEndpointArgs } from "../../../definitions/clientToken.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addClientToken } from "../addClientToken.js";
import { getClientTokens } from "../getClientTokens.js";
import { updateClientTokens } from "../updateClientTokens.js";

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

describe("updateClientTokens integration", () => {
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

  it("updates a single token by name", async () => {
    // Create a test token
    const token = await createTestToken("Original Token", {
      description: "Original description",
      meta: { type: "user" },
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
      ],
    });

    const args: UpdateClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        name: {
          eq: "Original Token",
        },
      },
      update: {
        name: "Updated Token",
        description: "Updated description",
        meta: { type: "admin" },
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
      },
      updateMany: false,
    };

    await updateClientTokens({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the update
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
          name: {
            eq: "Updated Token",
          },
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(1);
    const updatedToken = result.clientTokens[0];
    expect(updatedToken.name).toBe("Updated Token");
    expect(updatedToken.description).toBe("Updated description");
    expect(updatedToken.meta).toEqual({ type: "admin" });
    expect(updatedToken.permissions).toHaveLength(3);
    expect(updatedToken.permissions![0].entity).toBe("user");
    expect(updatedToken.permissions![0].action).toBe("read");
    expect(updatedToken.permissions![0].target).toBe("document");
    expect(updatedToken.updatedBy).toBe(defaultBy);
    expect(updatedToken.updatedByType).toBe(defaultByType);
  });

  it("updates multiple tokens when updateMany is true", async () => {
    // Create multiple test tokens
    await createTestToken("Token 1", { meta: { type: "user" } });
    await createTestToken("Token 2", { meta: { type: "user" } });
    await createTestToken("Token 3", { meta: { type: "admin" } });

    const args: UpdateClientTokensEndpointArgs = {
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
      update: {
        meta: { type: "updated", status: "active" },
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
      },
      updateMany: true,
    };

    await updateClientTokens({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the updates
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
          meta: [
            {
              op: "eq",
              field: "type",
              value: "updated",
            },
          ],
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(2);
    expect(result.clientTokens.every((t) => t.meta?.type === "updated")).toBe(
      true
    );
    expect(result.clientTokens.every((t) => t.meta?.status === "active")).toBe(
      true
    );
    expect(
      result.clientTokens.every((t) =>
        t.permissions?.some((p) => p.entity === "user" && p.action === "read")
      )
    ).toBe(true);
    expect(
      result.clientTokens.every((t) =>
        t.permissions?.some((p) => p.entity === "admin" && p.action === "write")
      )
    ).toBe(true);
  });

  it("updates only one token when updateMany is false", async () => {
    // Create multiple test tokens
    await createTestToken("Token 1", { meta: { type: "user" } });
    await createTestToken("Token 2", { meta: { type: "user" } });

    const args: UpdateClientTokensEndpointArgs = {
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
      update: {
        meta: { type: "updated" },
      },
      updateMany: false,
    };

    await updateClientTokens({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only one token was updated
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
          meta: [
            {
              op: "eq",
              field: "type",
              value: "updated",
            },
          ],
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(1);
  });

  it("updates token by id", async () => {
    // Create a test token
    const token = await createTestToken("Test Token");

    const args: UpdateClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        id: {
          eq: token.id,
        },
      },
      update: {
        name: "Updated by ID",
        description: "Updated via ID query",
      },
      updateMany: false,
    };

    await updateClientTokens({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the update
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
          id: {
            eq: token.id,
          },
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(1);
    expect(result.clientTokens[0].name).toBe("Updated by ID");
    expect(result.clientTokens[0].description).toBe("Updated via ID query");
  });

  it("updates token by createdBy", async () => {
    // Create a test token
    await createTestToken("Test Token");

    const args: UpdateClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        createdBy: {
          eq: defaultBy,
        },
      },
      update: {
        meta: { updated: "true" },
      },
      updateMany: true,
    };

    await updateClientTokens({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the update
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
          meta: [
            {
              op: "eq",
              field: "updated",
              value: "true",
            },
          ],
        },
      },
      storage,
    });

    expect(result.clientTokens.length).toBeGreaterThan(0);
    expect(result.clientTokens.every((t) => t.meta?.updated === "true")).toBe(
      true
    );
  });

  it("updates only specific fields", async () => {
    // Create a test token
    const token = await createTestToken("Test Token", {
      description: "Original description",
      meta: { type: "user" },
      permissions: ["read"],
    });

    const args: UpdateClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        name: {
          eq: "Test Token",
        },
      },
      update: {
        description: "Updated description only",
      },
      updateMany: false,
    };

    await updateClientTokens({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only the description was updated
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
          name: {
            eq: "Test Token",
          },
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(1);
    const updatedToken = result.clientTokens[0];
    expect(updatedToken.name).toBe("Test Token"); // Unchanged
    expect(updatedToken.description).toBe("Updated description only"); // Changed
    expect(updatedToken.meta).toEqual({ type: "user" }); // Unchanged
    expect(updatedToken.permissions).toHaveLength(1);
    expect(updatedToken.permissions![0].entity).toBe("user");
    expect(updatedToken.permissions![0].action).toBe("read");
    expect(updatedToken.permissions![0].target).toBe("document");
  });

  it("updates meta field completely", async () => {
    // Create a test token with complex meta
    const token = await createTestToken("Test Token", {
      meta: { type: "user", status: "active", nested: { key: "value" } },
    });

    const args: UpdateClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        name: {
          eq: "Test Token",
        },
      },
      update: {
        meta: { newType: "admin", newStatus: "inactive" },
      },
      updateMany: false,
    };

    await updateClientTokens({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify meta was completely replaced
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
          name: {
            eq: "Test Token",
          },
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(1);
    expect(result.clientTokens[0].meta).toEqual({
      newType: "admin",
      newStatus: "inactive",
    });
  });

  it("updates permissions field", async () => {
    // Create a test token
    const token = await createTestToken("Test Token", {
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
      ],
    });

    const args: UpdateClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        name: {
          eq: "Test Token",
        },
      },
      update: {
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
      },
      updateMany: false,
    };

    await updateClientTokens({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify permissions were updated
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
          name: {
            eq: "Test Token",
          },
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(1);
    expect(result.clientTokens[0].permissions).toHaveLength(3);
    expect(result.clientTokens[0].permissions![0].entity).toBe("user");
    expect(result.clientTokens[0].permissions![0].action).toBe("read");
    expect(result.clientTokens[0].permissions![0].target).toBe("document");
  });

  it("sets permissions to null", async () => {
    // Create a test token
    const token = await createTestToken("Test Token", {
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

    const args: UpdateClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        name: {
          eq: "Test Token",
        },
      },
      update: {
        permissions: undefined,
      },
      updateMany: false,
    };

    await updateClientTokens({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify permissions were set to null
    const result = await getClientTokens({
      args: {
        query: {
          appId: defaultAppId,
          name: {
            eq: "Test Token",
          },
        },
      },
      storage,
    });

    expect(result.clientTokens).toHaveLength(1);
    expect(result.clientTokens[0].permissions).toBeNull();
  });

  it("updates tokens across different apps", async () => {
    // Create tokens in different apps
    await createTestToken("Token 1", { appId: "app1" });
    await createTestToken("Token 2", { appId: "app2" });

    const args: UpdateClientTokensEndpointArgs = {
      query: {
        appId: "app1",
        name: {
          eq: "Token 1",
        },
      },
      update: {
        meta: { updated: "true" },
      },
      updateMany: false,
    };

    await updateClientTokens({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only the token in app1 was updated
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

    expect(result1.clientTokens[0].meta?.updated).toBe("true");
    expect(result2.clientTokens[0].meta?.updated).toBeUndefined();
  });
});
