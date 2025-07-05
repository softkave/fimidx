import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { UpdateAppsEndpointArgs } from "../../../definitions/app.js";
import { kObjTags } from "../../../definitions/obj.js";
import { kId0 } from "../../../definitions/system.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addApp } from "../addApp.js";
import { getApps } from "../getApps.js";
import { updateApps } from "../updateApps.js";

const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

// Test counter to ensure unique names
let testCounter = 0;

function makeUpdateAppsArgs(
  overrides: Partial<UpdateAppsEndpointArgs> = {}
): UpdateAppsEndpointArgs {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    query: {
      groupId: defaultGroupId,
      ...overrides.query,
    },
    update: {
      name: `Updated App Name ${uniqueId}`,
      ...overrides.update,
    },
    ...overrides,
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

describe("updateApps integration", () => {
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

  it("updates a single app by name", async () => {
    const testAppArgs = makeAddAppArgs({
      name: "Original App Name",
      description: "Original description",
    });

    const testApp = await addApp({
      args: testAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeUpdateAppsArgs({
      query: {
        groupId: defaultGroupId,
        name: { eq: "Original App Name" },
      },
      update: {
        name: "Updated App Name",
        description: "Updated description",
      },
    });

    await updateApps({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the update
    const result = await getApps({
      args: {
        query: { groupId: defaultGroupId },
      },
      storage,
    });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].name).toBe("Updated App Name");
    expect(result.apps[0].description).toBe("Updated description");
    expect(result.apps[0].updatedBy).toBe(defaultBy);
    expect(result.apps[0].updatedByType).toBe(defaultByType);
  });

  it("updates only specified fields", async () => {
    const testAppArgs = makeAddAppArgs({
      name: "Partial Update App",
      description: "Original description",
      objFieldsToIndex: ["field1", "field2"],
    });

    const testApp = await addApp({
      args: testAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeUpdateAppsArgs({
      query: {
        groupId: defaultGroupId,
        name: { eq: "Partial Update App" },
      },
      update: {
        name: "Only Name Updated",
      },
    });

    await updateApps({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only name was updated
    const result = await getApps({
      args: {
        query: { groupId: defaultGroupId },
      },
      storage,
    });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].name).toBe("Only Name Updated");
    expect(result.apps[0].description).toBe("Original description");
    expect(result.apps[0].objFieldsToIndex).toEqual(["field1", "field2"]);
  });

  it("updates multiple apps when query matches multiple", async () => {
    const app1Args = makeAddAppArgs({
      name: "App 1",
      groupId: "group-1",
    });
    const app2Args = makeAddAppArgs({
      name: "App 2",
      groupId: "group-1",
    });
    const app3Args = makeAddAppArgs({
      name: "App 3",
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

    await addApp({
      args: app3Args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeUpdateAppsArgs({
      query: {
        groupId: "group-1",
      },
      update: {
        description: "Updated for group-1",
      },
      updateMany: true,
    });

    await updateApps({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify updates
    const result = await getApps({
      args: {
        query: { groupId: "group-1" },
      },
      storage,
    });

    expect(result.apps).toHaveLength(2);
    result.apps.forEach((app) => {
      expect(app.description).toBe("Updated for group-1");
      expect(app.groupId).toBe("group-1");
    });

    // Verify app in group-2 was not updated
    const group2Result = await getApps({
      args: {
        query: { groupId: "group-2" },
      },
      storage,
    });

    expect(group2Result.apps).toHaveLength(1);
    expect(group2Result.apps[0].description).toBe("Test description");
  });

  it("updates apps by ID", async () => {
    const testAppArgs = makeAddAppArgs({
      name: "ID Update App",
    });

    const testApp = await addApp({
      args: testAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeUpdateAppsArgs({
      query: {
        id: { eq: testApp.app.id },
      },
      update: {
        name: "Updated by ID",
        description: "Updated via ID query",
      },
    });

    await updateApps({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the update
    const result = await getApps({
      args: {
        query: { id: { eq: testApp.app.id } },
      },
      storage,
    });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].name).toBe("Updated by ID");
    expect(result.apps[0].description).toBe("Updated via ID query");
  });

  it("updates apps by creation date range", async () => {
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

    const app2Args = makeAddAppArgs({ name: "App 2" });
    await addApp({
      args: app2Args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeUpdateAppsArgs({
      query: {
        createdAt: {
          gte: beforeDate.getTime(),
          lte: afterDate.getTime(),
        },
      },
      update: {
        description: "Updated by date range",
      },
      updateMany: true,
    });

    await updateApps({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify updates
    const result = await getApps({
      args: {
        query: { groupId: defaultGroupId },
      },
      storage,
    });

    expect(result.apps).toHaveLength(2);
    result.apps.forEach((app) => {
      expect(app.description).toBe("Updated by date range");
    });
  });

  it("updates apps by createdBy", async () => {
    const app1Args = makeAddAppArgs({ name: "User A App" });
    await addApp({
      args: app1Args,
      by: "user-a",
      byType: "user",
      storage,
    });

    const app2Args = makeAddAppArgs({ name: "User B App" });
    await addApp({
      args: app2Args,
      by: "user-b",
      byType: "user",
      storage,
    });

    const args = makeUpdateAppsArgs({
      query: {
        createdBy: { eq: "user-a" },
      },
      update: {
        description: "Updated for user-a",
      },
      updateMany: true,
    });

    await updateApps({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify updates
    const result = await getApps({
      args: {
        query: { groupId: defaultGroupId },
      },
      storage,
    });

    const userAApp = result.apps.find((app) => app.name === "User A App");
    const userBApp = result.apps.find((app) => app.name === "User B App");

    expect(userAApp?.description).toBe("Updated for user-a");
    expect(userBApp?.description).toBe("Test description");
  });

  it("handles updating objFieldsToIndex", async () => {
    const testAppArgs = makeAddAppArgs({
      name: "Fields Update App",
      objFieldsToIndex: ["field1", "field2"],
    });

    const testApp = await addApp({
      args: testAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeUpdateAppsArgs({
      query: {
        name: { eq: "Fields Update App" },
      },
      update: {
        objFieldsToIndex: ["field3", "field4", "field5"],
      },
    });

    await updateApps({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the update
    const result = await getApps({
      args: {
        query: { name: { eq: "Fields Update App" } },
      },
      storage,
    });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].objFieldsToIndex).toEqual([
      "field3",
      "field4",
      "field5",
    ]);
  });

  it("handles updating with null objFieldsToIndex", async () => {
    const testAppArgs = makeAddAppArgs({
      name: "Null Fields App",
      objFieldsToIndex: ["field1", "field2"],
    });

    const testApp = await addApp({
      args: testAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeUpdateAppsArgs({
      query: {
        name: { eq: "Null Fields App" },
      },
      update: {
        objFieldsToIndex: null,
      },
    });

    await updateApps({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the update
    const result = await getApps({
      args: {
        query: { name: { eq: "Null Fields App" } },
      },
      storage,
    });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].objFieldsToIndex).toBeNull();
  });

  it("handles updating with empty objFieldsToIndex array", async () => {
    const testAppArgs = makeAddAppArgs({
      name: "Empty Fields App",
      objFieldsToIndex: ["field1", "field2"],
    });

    const testApp = await addApp({
      args: testAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeUpdateAppsArgs({
      query: {
        name: { eq: "Empty Fields App" },
      },
      update: {
        objFieldsToIndex: [],
      },
    });

    await updateApps({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the update - empty arrays should be converted to null
    const result = await getApps({
      args: {
        query: { name: { eq: "Empty Fields App" } },
      },
      storage,
    });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].objFieldsToIndex).toBeNull();
  });

  it("handles updating with duplicate objFieldsToIndex values", async () => {
    const testAppArgs = makeAddAppArgs({
      name: "Duplicate Fields App",
      objFieldsToIndex: ["field1", "field2"],
    });

    const testApp = await addApp({
      args: testAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeUpdateAppsArgs({
      query: {
        name: { eq: "Duplicate Fields App" },
      },
      update: {
        objFieldsToIndex: ["field1", "field1", "field2", "field2"],
      },
    });

    await updateApps({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the update - duplicates should be deduplicated
    const result = await getApps({
      args: {
        query: { name: { eq: "Duplicate Fields App" } },
      },
      storage,
    });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].objFieldsToIndex).toEqual(["field1", "field2"]);
  });

  it("handles updating apps with special characters", async () => {
    const testAppArgs = makeAddAppArgs({
      name: "Special Chars App",
      description: "Original description",
    });

    const testApp = await addApp({
      args: testAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeUpdateAppsArgs({
      query: {
        name: { eq: "Special Chars App" },
      },
      update: {
        name: "Updated with special chars: !@#$%^&*()",
        description: "Updated with emojis 🚀 and symbols ©®™",
      },
    });

    await updateApps({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the update
    const result = await getApps({
      args: {
        query: { name: { eq: "Updated with special chars: !@#$%^&*()" } },
      },
      storage,
    });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].name).toBe("Updated with special chars: !@#$%^&*()");
    expect(result.apps[0].description).toBe(
      "Updated with emojis 🚀 and symbols ©®™"
    );
  });

  it("handles updating apps with very long values", async () => {
    const testAppArgs = makeAddAppArgs({
      name: "Long Values App",
      description: "Original description",
    });

    const testApp = await addApp({
      args: testAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const longName = "A".repeat(1000);
    const longDescription = "B".repeat(2000);

    const args = makeUpdateAppsArgs({
      query: {
        name: { eq: "Long Values App" },
      },
      update: {
        name: longName,
        description: longDescription,
      },
    });

    await updateApps({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the update
    const result = await getApps({
      args: {
        query: { name: { eq: longName } },
      },
      storage,
    });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].name).toBe(longName);
    expect(result.apps[0].description).toBe(longDescription);
  });

  it("handles updating apps with many objFieldsToIndex", async () => {
    const testAppArgs = makeAddAppArgs({
      name: "Many Fields App",
      objFieldsToIndex: ["field1", "field2"],
    });

    const testApp = await addApp({
      args: testAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const manyFields = Array.from({ length: 100 }, (_, i) => `field${i}`);

    const args = makeUpdateAppsArgs({
      query: {
        name: { eq: "Many Fields App" },
      },
      update: {
        objFieldsToIndex: manyFields,
      },
    });

    await updateApps({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the update
    const result = await getApps({
      args: {
        query: { name: { eq: "Many Fields App" } },
      },
      storage,
    });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].objFieldsToIndex).toEqual(manyFields);
  });

  it("handles updating apps with empty string values", async () => {
    const testAppArgs = makeAddAppArgs({
      name: "Empty String App",
      description: "Original description",
    });

    const testApp = await addApp({
      args: testAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const args = makeUpdateAppsArgs({
      query: {
        name: { eq: "Empty String App" },
      },
      update: {
        name: "",
        description: "",
      },
    });

    await updateApps({
      args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the update
    const result = await getApps({
      args: {
        query: { name: { eq: "" } },
      },
      storage,
    });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].name).toBe("");
    expect(result.apps[0].description).toBe("");
  });

  it("handles updating apps created by different users", async () => {
    const app1Args = makeAddAppArgs({ name: "User A App" });
    await addApp({
      args: app1Args,
      by: "user-a",
      byType: "user",
      storage,
    });

    const app2Args = makeAddAppArgs({ name: "User B App" });
    await addApp({
      args: app2Args,
      by: "user-b",
      byType: "user",
      storage,
    });

    const args = makeUpdateAppsArgs({
      query: {
        createdBy: { eq: "user-a" },
      },
      update: {
        description: "Updated by user-a",
      },
      updateMany: true,
    });

    await updateApps({
      args,
      by: "updater",
      byType: "system",
      storage,
    });

    // Verify updates
    const result = await getApps({
      args: {
        query: { groupId: defaultGroupId },
      },
      storage,
    });

    const userAApp = result.apps.find((app) => app.name === "User A App");
    const userBApp = result.apps.find((app) => app.name === "User B App");

    expect(userAApp?.description).toBe("Updated by user-a");
    expect(userAApp?.updatedBy).toBe("updater");
    expect(userAApp?.updatedByType).toBe("system");
    expect(userBApp?.description).toBe("Test description");
  });

  it("handles concurrent updates", async () => {
    const testAppArgs = makeAddAppArgs({
      name: "Concurrent Update App",
      description: "Original description",
    });

    const testApp = await addApp({
      args: testAppArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const promises = Array.from({ length: 5 }, (_, i) =>
      updateApps({
        args: makeUpdateAppsArgs({
          query: {
            name: { eq: "Concurrent Update App" },
          },
          update: {
            description: `Update ${i}`,
          },
        }),
        by: `updater-${i}`,
        byType: "user",
        storage,
      })
    );

    await Promise.all(promises);

    // Verify the final state
    const result = await getApps({
      args: {
        query: { name: { eq: "Concurrent Update App" } },
      },
      storage,
    });

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].description).toBeDefined();
    expect(result.apps[0].updatedBy).toMatch(/updater-\d/);
  });
});
