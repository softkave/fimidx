import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { db, objFields as objFieldsTable } from "../../../db/fmdx.sqlite.js";
import type { GetClientTokensEndpointArgs } from "../../../definitions/clientToken.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addClientToken } from "../addClientToken.js";
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

describe("getClientTokens integration", () => {
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

      // Clean up objFields for test app
      await db
        .delete(objFieldsTable)
        .where(
          and(
            eq(objFieldsTable.appId, defaultAppId),
            eq(objFieldsTable.tag, kObjTags.clientToken)
          )
        );
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

      // Clean up objFields for test app
      await db
        .delete(objFieldsTable)
        .where(
          and(
            eq(objFieldsTable.appId, defaultAppId),
            eq(objFieldsTable.tag, kObjTags.clientToken)
          )
        );
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  it("returns empty array when no tokens exist", async () => {
    const args: GetClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getClientTokens({
      args,
      storage,
    });

    expect(result.clientTokens).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
  });

  it("retrieves all tokens for an app", async () => {
    // Create test tokens
    const token1 = await createTestToken("Token 1");
    const token2 = await createTestToken("Token 2");
    const token3 = await createTestToken("Token 3");

    const args: GetClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getClientTokens({
      args,
      storage,
    });

    expect(result.clientTokens).toHaveLength(3);
    expect(result.hasMore).toBe(false);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);

    // Verify all tokens are returned
    const tokenNames = result.clientTokens.map((t) => t.name).sort();
    expect(tokenNames).toEqual(["Token 1", "Token 2", "Token 3"].sort());
  });

  it("filters tokens by name", async () => {
    // Create test tokens
    await createTestToken("Apple Token");
    await createTestToken("Banana Token");
    await createTestToken("Cherry Token");

    const args: GetClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        name: {
          eq: "Apple Token",
        },
      },
    };

    const result = await getClientTokens({
      args,
      storage,
    });

    expect(result.clientTokens).toHaveLength(1);
    expect(result.clientTokens[0].name).toBe("Apple Token");
  });

  it("filters tokens by name with in", async () => {
    // Create test tokens
    await createTestToken("Apple Token");
    await createTestToken("Banana Token");
    await createTestToken("Cherry Token");

    const args: GetClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        name: {
          in: ["Apple Token", "Banana Token"],
        },
      },
    };

    const result = await getClientTokens({
      args,
      storage,
    });

    expect(result.clientTokens).toHaveLength(2);
    expect(
      result.clientTokens.every((t) =>
        ["Apple Token", "Banana Token"].includes(t.name)
      )
    ).toBe(true);
  });

  it("filters tokens by meta field", async () => {
    // Create test tokens with different meta
    await createTestToken("Token 1", { meta: { type: "admin" } });
    await createTestToken("Token 2", { meta: { type: "user" } });
    await createTestToken("Token 3", { meta: { type: "admin" } });

    const args: GetClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        meta: [
          {
            op: "eq",
            field: "type",
            value: "admin",
          },
        ],
      },
    };

    const result = await getClientTokens({
      args,
      storage,
    });

    expect(result.clientTokens).toHaveLength(2);
    expect(result.clientTokens.every((t) => t.meta?.type === "admin")).toBe(
      true
    );
  });

  it("handles pagination correctly", async () => {
    // Create 5 test tokens
    for (let i = 1; i <= 5; i++) {
      await createTestToken(`Token ${i}`);
    }

    const args: GetClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
      },
      page: 1,
      limit: 2,
    };

    const result = await getClientTokens({
      args,
      storage,
    });

    expect(result.clientTokens).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(2);
  });

  it("handles second page correctly", async () => {
    // Create 5 test tokens
    for (let i = 1; i <= 5; i++) {
      await createTestToken(`Token ${i}`);
    }

    const args: GetClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
      },
      page: 2,
      limit: 2,
    };

    const result = await getClientTokens({
      args,
      storage,
    });

    expect(result.clientTokens).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(2);
  });

  it("handles last page correctly", async () => {
    // Create 5 test tokens
    for (let i = 1; i <= 5; i++) {
      await createTestToken(`Token ${i}`);
    }

    const args: GetClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
      },
      page: 3,
      limit: 2,
    };

    const result = await getClientTokens({
      args,
      storage,
    });

    expect(result.clientTokens).toHaveLength(1);
    expect(result.hasMore).toBe(false);
    expect(result.page).toBe(3);
    expect(result.limit).toBe(2);
  });

  it("sorts tokens by name ascending", async () => {
    // Insert the name field definition for sorting
    await insertNameFieldForSorting({
      appId: defaultAppId,
      groupId: defaultGroupId,
      tag: kObjTags.clientToken,
    });

    // Create test tokens in random order
    await createTestToken("Zebra Token");
    await createTestToken("Apple Token");
    await createTestToken("Banana Token");

    const args: GetClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
      },
      sort: [
        {
          field: "name",
          direction: "asc",
        },
      ],
    };

    const result = await getClientTokens({
      args,
      storage,
    });

    expect(result.clientTokens).toHaveLength(3);
    expect(result.clientTokens[0].name).toBe("Apple Token");
    expect(result.clientTokens[1].name).toBe("Banana Token");
    expect(result.clientTokens[2].name).toBe("Zebra Token");
  });

  it("sorts tokens by name descending", async () => {
    // Insert the name field definition for sorting
    await insertNameFieldForSorting({
      appId: defaultAppId,
      groupId: defaultGroupId,
      tag: kObjTags.clientToken,
    });

    // Create test tokens in random order
    await createTestToken("Apple Token");
    await createTestToken("Zebra Token");
    await createTestToken("Banana Token");

    const args: GetClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
      },
      sort: [
        {
          field: "name",
          direction: "desc",
        },
      ],
    };

    const result = await getClientTokens({
      args,
      storage,
    });

    expect(result.clientTokens).toHaveLength(3);
    expect(result.clientTokens[0].name).toBe("Zebra Token");
    expect(result.clientTokens[1].name).toBe("Banana Token");
    expect(result.clientTokens[2].name).toBe("Apple Token");
  });

  it("filters tokens by createdBy", async () => {
    // Create tokens with different creators
    await createTestToken("Token 1");
    await createTestToken("Token 2");

    const args: GetClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        createdBy: {
          eq: defaultBy,
        },
      },
    };

    const result = await getClientTokens({
      args,
      storage,
    });

    expect(result.clientTokens).toHaveLength(2);
    expect(result.clientTokens.every((t) => t.createdBy === defaultBy)).toBe(
      true
    );
  });

  it("filters tokens by multiple criteria", async () => {
    // Create tokens with different characteristics
    await createTestToken("Admin Token", { meta: { type: "admin" } });
    await createTestToken("User Token", { meta: { type: "user" } });
    await createTestToken("Admin Token 2", { meta: { type: "admin" } });

    const args: GetClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
        name: {
          in: ["Admin Token", "Admin Token 2"],
        },
        meta: [
          {
            op: "eq",
            field: "type",
            value: "admin",
          },
        ],
      },
    };

    const result = await getClientTokens({
      args,
      storage,
    });

    expect(result.clientTokens).toHaveLength(2);
    expect(result.clientTokens.every((t) => t.name.includes("Admin"))).toBe(
      true
    );
    expect(result.clientTokens.every((t) => t.meta?.type === "admin")).toBe(
      true
    );
  });

  it("uses default pagination when not specified", async () => {
    // Create test tokens
    await createTestToken("Token 1");
    await createTestToken("Token 2");

    const args: GetClientTokensEndpointArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getClientTokens({
      args,
      storage,
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
  });

  it("filters tokens by appId correctly", async () => {
    // Create tokens in different apps
    await createTestToken("Token 1", { appId: "app1" });
    await createTestToken("Token 2", { appId: "app2" });
    await createTestToken("Token 3", { appId: "app1" });

    const args: GetClientTokensEndpointArgs = {
      query: {
        appId: "app1",
      },
    };

    const result = await getClientTokens({
      args,
      storage,
    });

    expect(result.clientTokens).toHaveLength(2);
    expect(result.clientTokens.every((t) => t.appId === "app1")).toBe(true);
  });
});

// Helper function to insert objFields for the "name" field
async function insertNameFieldForSorting(params: {
  appId: string;
  groupId: string;
  tag: string;
}) {
  const { appId, groupId, tag } = params;
  const now = new Date();

  const nameField = {
    id: uuidv7(),
    createdAt: now,
    updatedAt: now,
    appId,
    groupId,
    field: "name", // This is the field name that getManyObjs will look for
    fieldKeys: ["name"],
    fieldKeyTypes: ["string"],
    valueTypes: ["string"],
    tag,
  };

  // Insert the field definition
  await db.insert(objFieldsTable).values(nameField);

  return nameField;
}
