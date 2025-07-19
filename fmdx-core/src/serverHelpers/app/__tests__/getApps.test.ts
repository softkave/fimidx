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
import type { GetAppsEndpointArgs } from "../../../definitions/app.js";
import { kObjTags } from "../../../definitions/obj.js";
import { kId0 } from "../../../definitions/system.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addApp } from "../addApp.js";
import { getApps } from "../getApps.js";

const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

// Test counter to ensure unique names
let testCounter = 0;

function makeGetAppsArgs(
  overrides: Partial<GetAppsEndpointArgs> = {}
): GetAppsEndpointArgs {
  return {
    query: {
      orgId: defaultGroupId,
      ...overrides.query,
    },
    page: overrides.page,
    limit: overrides.limit,
    sort: overrides.sort,
  };
}

function makeAddAppArgs(overrides: any = {}) {
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

// Helper function to insert objFields for the "name" field
async function insertNameFieldForSorting(params: {
  groupId: string;
  tag: string;
}) {
  const { groupId, tag } = params;
  const now = new Date();

  const nameField = {
    id: uuidv7(),
    createdAt: now,
    updatedAt: now,
    appId: kId0, // System app ID for apps
    groupId,
    tag,
    field: "name",
    path: "name",
    type: "string",
    arrayTypes: [],
    isArrayCompressed: false,
    fieldKeys: ["name"],
    fieldKeyTypes: ["string"],
    valueTypes: ["string"],
  };

  // Insert the field definition
  await db.insert(objFieldsTable).values(nameField);

  return nameField;
}

describe("getApps integration", () => {
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
      // Delete all apps for all test groups using hard deletes
      const testGroupIds = [
        defaultGroupId,
        "test-group-getApps-1",
        "test-group-getApps-2",
      ];
      for (const groupId of testGroupIds) {
        await storage.bulkDelete({
          query: { appId: kId0 },
          tag: kObjTags.app,
          deletedBy: defaultBy,
          deletedByType: defaultByType,
          deleteMany: true,
          hardDelete: true, // Use hard delete for test cleanup
        });
      }

      // Clean up objFields for test groups
      for (const groupId of testGroupIds) {
        await db
          .delete(objFieldsTable)
          .where(
            and(
              eq(objFieldsTable.appId, kId0),
              eq(objFieldsTable.groupId, groupId),
              eq(objFieldsTable.tag, kObjTags.app)
            )
          );
      }
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  afterEach(async () => {
    // Clean up after each test using hard deletes for complete isolation
    try {
      // Delete all apps for all test groups using hard deletes
      const testGroupIds = [
        defaultGroupId,
        "test-group-getApps-1",
        "test-group-getApps-2",
      ];
      for (const groupId of testGroupIds) {
        await storage.bulkDelete({
          query: { appId: kId0 },
          tag: kObjTags.app,
          deletedBy: defaultBy,
          deletedByType: defaultByType,
          deleteMany: true,
          hardDelete: true, // Use hard delete for test cleanup
        });
      }

      // Clean up objFields for test groups
      for (const groupId of testGroupIds) {
        await db
          .delete(objFieldsTable)
          .where(
            and(
              eq(objFieldsTable.appId, kId0),
              eq(objFieldsTable.groupId, groupId),
              eq(objFieldsTable.tag, kObjTags.app)
            )
          );
      }
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  it("returns empty array when no apps exist", async () => {
    const args = makeGetAppsArgs();

    const result = await getApps({ args, storage });

    expect(result.apps).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
  });

  it("verifies test isolation by checking empty state", async () => {
    // This test verifies that our cleanup is working
    const args = makeGetAppsArgs();
    const result = await getApps({ args, storage });

    // Should be empty after cleanup
    expect(result.apps).toEqual([]);

    // Create one app
    const appArgs = makeAddAppArgs({ name: "Isolation Test App" });
    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Should find exactly one app
    const result2 = await getApps({ args, storage });
    expect(result2.apps).toHaveLength(1);
    expect(result2.apps[0].name).toBe("Isolation Test App");
  });

  it("returns all apps when no filters are applied", async () => {
    // Create multiple apps
    const app1Args = makeAddAppArgs({ name: "App 1" });
    const app2Args = makeAddAppArgs({ name: "App 2" });
    const app3Args = makeAddAppArgs({ name: "App 3" });

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

    await addApp({
      args: app3Args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs();

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(3);
    expect(result.hasMore).toBe(false);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
  });

  it("filters apps by groupId", async () => {
    // Create apps in different groups
    const app1Args = makeAddAppArgs({ name: "App 1", groupId: "group-1" });
    const app2Args = makeAddAppArgs({ name: "App 2", groupId: "group-2" });
    const app3Args = makeAddAppArgs({ name: "App 3", groupId: "group-1" });

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

    await addApp({
      args: app3Args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs({
      query: { orgId: "group-1" },
    });

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(2);
    expect(result.apps.every((app) => app.orgId === "group-1")).toBe(true);
  });

  it("filters apps by name", async () => {
    const targetAppArgs = makeAddAppArgs({ name: "Target App" });
    const otherAppArgs = makeAddAppArgs({ name: "Other App" });

    await addApp({
      args: targetAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    await addApp({
      args: otherAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs({
      query: { name: { eq: "Target App" } },
    });

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].name).toBe("Target App");
  });

  it("filters apps by createdBy", async () => {
    const targetAppArgs = makeAddAppArgs({ name: "App 1" });
    const otherAppArgs = makeAddAppArgs({ name: "App 2" });

    await addApp({
      args: targetAppArgs,
      by: "user-a",
      byType: "user",
      storage,
    });

    await addApp({
      args: otherAppArgs,
      by: "user-b",
      byType: "user",
      storage,
    });

    const args = makeGetAppsArgs({
      query: { createdBy: { eq: "user-a" } },
    });

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].createdBy).toBe("user-a");
  });

  it("filters apps by creation date range", async () => {
    const beforeDate = new Date();
    beforeDate.setHours(beforeDate.getHours() - 1);

    const app1Args = makeAddAppArgs({ name: "App 1" });
    await addApp({
      args: app1Args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const afterDate = new Date();
    afterDate.setHours(afterDate.getHours() + 1);

    const args = makeGetAppsArgs({
      query: {
        createdAt: {
          gte: beforeDate.getTime(),
          lte: afterDate.getTime(),
        },
      },
    });

    const result = await getApps({ args, storage });

    expect(result.apps.length).toBeGreaterThan(0);
    result.apps.forEach((app) => {
      expect(app.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeDate.getTime()
      );
      expect(app.createdAt.getTime()).toBeLessThanOrEqual(afterDate.getTime());
    });
  });

  it("sorts apps by name in ascending order", async () => {
    // Insert the name field definition for sorting
    await insertNameFieldForSorting({
      groupId: defaultGroupId,
      tag: kObjTags.app,
    });

    // Create apps in random order
    const zebraArgs = makeTestAppArgs("Zebra");
    const alphaArgs = makeTestAppArgs("Alpha");
    const betaArgs = makeTestAppArgs("Beta");

    await addApp({
      args: zebraArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    await addApp({
      args: alphaArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    await addApp({
      args: betaArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs({
      sort: [{ field: "name", direction: "asc" }],
    });

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(3);
    const sortedNames = [alphaArgs.name, betaArgs.name, zebraArgs.name].sort();
    expect(result.apps.map((a) => a.name)).toEqual(sortedNames);
  });

  it("sorts apps by name in descending order", async () => {
    // Insert the name field definition for sorting
    await insertNameFieldForSorting({
      groupId: defaultGroupId,
      tag: kObjTags.app,
    });

    // Create apps in random order
    const alphaArgs = makeTestAppArgs("Alpha");
    const zebraArgs = makeTestAppArgs("Zebra");
    const betaArgs = makeTestAppArgs("Beta");

    await addApp({
      args: alphaArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    await addApp({
      args: zebraArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    await addApp({
      args: betaArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs({
      sort: [{ field: "name", direction: "desc" }],
    });

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(3);
    const sortedNames = [alphaArgs.name, betaArgs.name, zebraArgs.name]
      .sort()
      .reverse();
    expect(result.apps.map((a) => a.name)).toEqual(sortedNames);
  });

  it("sorts apps by creation date", async () => {
    // Insert the name field definition for sorting (needed for objRecord fields)
    await insertNameFieldForSorting({
      groupId: defaultGroupId,
      tag: kObjTags.app,
    });

    // Create apps with delays to ensure different timestamps
    const app1Args = makeTestAppArgs("First");
    const app1 = await addApp({
      args: app1Args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const app2Args = makeTestAppArgs("Second");
    const app2 = await addApp({
      args: app2Args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const app3Args = makeTestAppArgs("Third");
    const app3 = await addApp({
      args: app3Args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs({
      sort: [{ field: "createdAt", direction: "desc" }],
    });

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(3);
    expect(result.apps[0].name).toBe(app3Args.name);
    expect(result.apps[1].name).toBe(app2Args.name);
    expect(result.apps[2].name).toBe(app1Args.name);
  });

  it("handles pagination correctly", async () => {
    // Create multiple apps
    for (let i = 1; i <= 5; i++) {
      await addApp({
        args: makeAddAppArgs({ name: `App ${i}` }),
        by: defaultBy,
        byType: defaultByType,
        storage,
      });
    }

    // First page
    const args1 = makeGetAppsArgs({
      page: 1,
      limit: 2,
    });

    const result1 = await getApps({ args: args1, storage });

    expect(result1.apps).toHaveLength(2);
    expect(result1.page).toBe(1);
    expect(result1.limit).toBe(2);
    expect(result1.hasMore).toBe(true);

    // Second page
    const args2 = makeGetAppsArgs({
      page: 2,
      limit: 2,
    });

    const result2 = await getApps({ args: args2, storage });

    expect(result2.apps).toHaveLength(2);
    expect(result2.page).toBe(2);
    expect(result2.limit).toBe(2);
    expect(result2.hasMore).toBe(true);

    // Third page
    const args3 = makeGetAppsArgs({
      page: 3,
      limit: 2,
    });

    const result3 = await getApps({ args: args3, storage });

    expect(result3.apps).toHaveLength(1);
    expect(result3.page).toBe(3);
    expect(result3.limit).toBe(2);
    expect(result3.hasMore).toBe(false);
  });

  it("uses default pagination values when not provided", async () => {
    // Create 3 apps
    const appArgs = [];
    for (let i = 1; i <= 3; i++) {
      const args = makeTestAppArgs(`App${i}`);
      appArgs.push(args);
      await addApp({
        args,
        by: defaultBy,
        byType: defaultByType,
        storage,
      });
    }

    const args = makeGetAppsArgs({
      // page and limit not provided
    });

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(3);
    expect(result.hasMore).toBe(false);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
  });

  it("returns apps with correct structure", async () => {
    const testAppArgs = makeAddAppArgs({
      name: "Test App",
      description: "Test Description",
      objFieldsToIndex: ["field1", "field2"],
    });

    const testApp = await addApp({
      args: testAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs();

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(1);
    const app = result.apps[0];

    expect(app.id).toBe(testApp.app.id);
    expect(app.name).toBe("Test App");
    expect(app.description).toBe("Test Description");
    expect(app.orgId).toBe(defaultGroupId);
    expect(app.objFieldsToIndex).toEqual(["field1", "field2"]);
    expect(app.createdAt).toBeInstanceOf(Date);
    expect(app.updatedAt).toBeInstanceOf(Date);
    expect(app.createdBy).toBeDefined();
    expect(app.createdByType).toBeDefined();
    expect(app.updatedBy).toBeDefined();
    expect(app.updatedByType).toBeDefined();
  });

  it("handles apps with undefined description and objFieldsToIndex", async () => {
    await addApp({
      args: makeAddAppArgs({
        name: "Minimal App",
        description: undefined,
        objFieldsToIndex: undefined,
      }),
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs();

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(1);
    const app = result.apps[0];
    expect(app.name).toBe("Minimal App");
    expect(app.description).toBeUndefined();
    expect(app.objFieldsToIndex).toBeNull();
  });

  it("filters apps by multiple criteria", async () => {
    // Create apps with different characteristics
    const targetAppArgs = makeAddAppArgs({
      name: "Target App",
    });
    await addApp({
      args: targetAppArgs,
      by: "user-a",
      byType: "user",
      storage,
    });

    const otherAppArgs = makeAddAppArgs({
      name: "Other App",
    });
    await addApp({
      args: otherAppArgs,
      by: "user-b",
      byType: "user",
      storage,
    });

    const args = makeGetAppsArgs({
      query: {
        name: { eq: "Target App" },
        createdBy: { eq: "user-a" },
      },
    });

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].name).toBe("Target App");
    expect(result.apps[0].createdBy).toBe("user-a");
  });

  it("handles case-insensitive name search", async () => {
    const testAppArgs = makeAddAppArgs({ name: "TestApp" });
    await addApp({
      args: testAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs({
      query: { name: { eq: "TestApp" } },
    });

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].name).toBe("TestApp");
  });

  it("handles partial name search", async () => {
    const app1Args = makeAddAppArgs({ name: "MyApp" });
    const app2Args = makeAddAppArgs({ name: "MyOtherApp" });
    const app3Args = makeAddAppArgs({ name: "DifferentApp" });

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

    await addApp({
      args: app3Args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs({
      query: { name: { in: ["MyApp", "MyOtherApp"] } },
    });

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(2);
    expect(result.apps.every((app) => app.name.includes("My"))).toBe(true);
  });

  it("handles apps with special characters in names", async () => {
    const specialAppArgs = makeAddAppArgs({
      name: "App with spaces & symbols!@#",
    });
    await addApp({
      args: specialAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs();

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].name).toBe("App with spaces & symbols!@#");
  });

  it("handles very long app names", async () => {
    const longName = "A".repeat(1000);
    const longAppArgs = makeAddAppArgs({ name: longName });
    await addApp({
      args: longAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs();

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].name).toBe(longName);
  });

  it("handles apps with empty string names", async () => {
    const emptyNameAppArgs = makeAddAppArgs({ name: "" });
    await addApp({
      args: emptyNameAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs();

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].name).toBe("");
  });

  it("handles apps with very long descriptions", async () => {
    const longDescription = "A".repeat(5000);
    const longDescAppArgs = makeAddAppArgs({
      name: "Long Desc App",
      description: longDescription,
    });
    await addApp({
      args: longDescAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs();

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].description).toBe(longDescription);
  });

  it("handles apps with many objFieldsToIndex", async () => {
    const manyFields = Array.from({ length: 100 }, (_, i) => `field${i}`);
    const manyFieldsAppArgs = makeAddAppArgs({
      name: "Many Fields App",
      objFieldsToIndex: manyFields,
    });
    await addApp({
      args: manyFieldsAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeGetAppsArgs();

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].objFieldsToIndex).toEqual(manyFields);
  });

  it("handles concurrent app creation and retrieval", async () => {
    // Create multiple apps concurrently
    const promises = Array.from({ length: 10 }, (_, i) =>
      addApp({
        args: makeAddAppArgs({ name: `Concurrent App ${i}` }),
        by: defaultBy,
        byType: defaultByType,
        storage,
      })
    );

    await Promise.all(promises);

    const args = makeGetAppsArgs();

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(10);
    expect(
      result.apps.every((app) => app.name.startsWith("Concurrent App"))
    ).toBe(true);
  });

  it("handles apps created by different users", async () => {
    const user1AppArgs = makeAddAppArgs({ name: "User 1 App" });
    const user2AppArgs = makeAddAppArgs({ name: "User 2 App" });

    await addApp({
      args: user1AppArgs,
      by: "user1",
      byType: "user",
      storage,
    });

    await addApp({
      args: user2AppArgs,
      by: "user2",
      byType: "user",
      storage,
    });

    const args = makeGetAppsArgs();

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(2);
    const user1App = result.apps.find((app) => app.name === "User 1 App");
    const user2App = result.apps.find((app) => app.name === "User 2 App");

    expect(user1App?.createdBy).toBe("user1");
    expect(user2App?.createdBy).toBe("user2");
  });

  it("handles apps with different byType values", async () => {
    const userAppArgs = makeAddAppArgs({ name: "User App" });
    const systemAppArgs = makeAddAppArgs({ name: "System App" });

    await addApp({
      args: userAppArgs,
      by: "user1",
      byType: "user",
      storage,
    });

    await addApp({
      args: systemAppArgs,
      by: "system",
      byType: "system",
      storage,
    });

    const args = makeGetAppsArgs();

    const result = await getApps({ args, storage });

    expect(result.apps).toHaveLength(2);
    const userApp = result.apps.find((app) => app.name === "User App");
    const systemApp = result.apps.find((app) => app.name === "System App");

    expect(userApp?.createdByType).toBe("user");
    expect(systemApp?.createdByType).toBe("system");
  });
});
