import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { DeleteAppsEndpointArgs } from "../../../definitions/app.js";
import { kObjTags } from "../../../definitions/obj.js";
import { kId0 } from "../../../definitions/system.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addApp } from "../addApp.js";
import { deleteApps } from "../deleteApps.js";
import { getApps } from "../getApps.js";

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

function makeDeleteAppsArgs(
  overrides: Partial<DeleteAppsEndpointArgs> = {}
): DeleteAppsEndpointArgs {
  return {
    query: {
      orgId: defaultGroupId,
      ...overrides.query,
    },
    deleteMany: overrides.deleteMany,
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

describe("deleteApps integration", () => {
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

  it("deletes a single app by id", async () => {
    // Create an app first
    const appArgs = makeAddAppArgs({ name: "App to Delete" });
    const createdApp = await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    expect(createdApp.app).toBeDefined();

    // Verify app exists before deletion
    const appsBefore = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsBefore.apps).toHaveLength(1);

    // Delete the app
    await deleteApps({
      ...makeDeleteAppsArgs({
        query: {
          orgId: defaultGroupId,
          id: { eq: createdApp.app.id },
        },
      }),
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify app is deleted
    const appsAfter = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsAfter.apps).toHaveLength(0);
  });

  it("deletes multiple apps by name", async () => {
    // Create multiple apps
    const app1Args = makeAddAppArgs({ name: "First App" });
    const app2Args = makeAddAppArgs({ name: "Second App" });
    const app3Args = makeAddAppArgs({ name: "Third App" });

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

    // Verify apps exist before deletion
    const appsBefore = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsBefore.apps).toHaveLength(3);

    // Delete apps by name pattern
    await deleteApps({
      ...makeDeleteAppsArgs({
        query: {
          orgId: defaultGroupId,
          name: { in: ["First App", "Second App"] },
        },
        deleteMany: true,
      }),
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only specified apps are deleted
    const appsAfter = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsAfter.apps).toHaveLength(1);
    expect(appsAfter.apps[0].name).toBe("Third App");
  });

  it("deletes apps by groupId", async () => {
    // Create apps in different groups
    const app1Args = makeAddAppArgs({
      name: "Group 1 App",
      groupId: "group-1",
    });
    const app2Args = makeAddAppArgs({
      name: "Group 1 App 2",
      groupId: "group-1",
    });
    const app3Args = makeAddAppArgs({
      name: "Group 2 App",
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

    // Verify apps exist before deletion
    const appsBefore = await getApps({
      args: {
        query: { orgId: "group-1" },
      },
      storage,
    });
    expect(appsBefore.apps).toHaveLength(2);

    // Delete apps in group-1
    await deleteApps({
      ...makeDeleteAppsArgs({
        query: {
          orgId: "group-1",
        },
        deleteMany: true,
      }),
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify group-1 apps are deleted
    const group1AppsAfter = await getApps({
      args: {
        query: { orgId: "group-1" },
      },
      storage,
    });
    expect(group1AppsAfter.apps).toHaveLength(0);

    // Verify group-2 app still exists
    const group2AppsAfter = await getApps({
      args: {
        query: { orgId: "group-2" },
      },
      storage,
    });
    expect(group2AppsAfter.apps).toHaveLength(1);
    expect(group2AppsAfter.apps[0].name).toBe("Group 2 App");
  });

  it("deletes apps by creation date range", async () => {
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

    // Verify apps exist before deletion
    const appsBefore = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsBefore.apps).toHaveLength(2);

    // Delete apps by date range
    await deleteApps({
      ...makeDeleteAppsArgs({
        query: {
          createdAt: {
            gte: beforeDate.getTime(),
            lte: afterDate.getTime(),
          },
        },
        deleteMany: true,
      }),
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify apps are deleted
    const appsAfter = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsAfter.apps).toHaveLength(0);
  });

  it("deletes apps by createdBy", async () => {
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

    // Verify apps exist before deletion
    const appsBefore = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsBefore.apps).toHaveLength(2);

    // Delete apps by user-a
    await deleteApps({
      ...makeDeleteAppsArgs({
        query: {
          createdBy: { eq: "user-a" },
        },
        deleteMany: true,
      }),
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only user-a app is deleted
    const appsAfter = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsAfter.apps).toHaveLength(1);
    expect(appsAfter.apps[0].name).toBe("User B App");
    expect(appsAfter.apps[0].createdBy).toBe("user-b");
  });

  it("deletes apps with special characters in names", async () => {
    const appArgs = makeAddAppArgs({
      name: "App with special chars: !@#$%^&*()",
      description: "Description with emojis 🚀 and symbols ©®™",
    });

    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify app exists before deletion
    const appsBefore = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsBefore.apps).toHaveLength(1);

    // Delete the app
    await deleteApps({
      ...makeDeleteAppsArgs({
        query: {
          orgId: defaultGroupId,
          name: { eq: "App with special chars: !@#$%^&*()" },
        },
      }),
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify app is deleted
    const appsAfter = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsAfter.apps).toHaveLength(0);
  });

  it("deletes apps with very long names and descriptions", async () => {
    const longName = "A".repeat(1000);
    const longDescription = "B".repeat(2000);

    const appArgs = makeAddAppArgs({
      name: longName,
      description: longDescription,
    });

    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify app exists before deletion
    const appsBefore = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsBefore.apps).toHaveLength(1);

    // Delete the app
    await deleteApps({
      ...makeDeleteAppsArgs({
        query: {
          orgId: defaultGroupId,
          name: { eq: longName },
        },
      }),
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify app is deleted
    const appsAfter = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsAfter.apps).toHaveLength(0);
  });

  it("deletes apps with many objFieldsToIndex", async () => {
    const manyFields = Array.from({ length: 100 }, (_, i) => `field${i}`);

    const appArgs = makeAddAppArgs({
      name: "Many Fields App",
      objFieldsToIndex: manyFields,
    });

    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify app exists before deletion
    const appsBefore = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsBefore.apps).toHaveLength(1);

    // Delete the app
    await deleteApps({
      ...makeDeleteAppsArgs({
        query: {
          orgId: defaultGroupId,
          name: { eq: "Many Fields App" },
        },
      }),
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify app is deleted
    const appsAfter = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsAfter.apps).toHaveLength(0);
  });

  it("deletes apps with empty string names", async () => {
    const appArgs = makeAddAppArgs({ name: "" });

    await addApp({
      args: appArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify app exists before deletion
    const appsBefore = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsBefore.apps).toHaveLength(1);

    // Delete the app
    await deleteApps({
      ...makeDeleteAppsArgs({
        query: {
          orgId: defaultGroupId,
          name: { eq: "" },
        },
      }),
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify app is deleted
    const appsAfter = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsAfter.apps).toHaveLength(0);
  });

  it("handles deleting non-existent apps gracefully", async () => {
    // Try to delete a non-existent app
    await deleteApps({
      ...makeDeleteAppsArgs({
        query: {
          orgId: defaultGroupId,
          name: { eq: "Non-existent App" },
        },
      }),
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Should not throw an error
    const appsAfter = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsAfter.apps).toHaveLength(0);
  });

  it("handles deleting apps with different byType values", async () => {
    const app1Args = makeAddAppArgs({ name: "User App" });
    await addApp({
      args: app1Args,
      by: "user1",
      byType: "user",
      storage,
    });

    const app2Args = makeAddAppArgs({ name: "System App" });
    await addApp({
      args: app2Args,
      by: "system",
      byType: "system",
      storage,
    });

    // Verify apps exist before deletion
    const appsBefore = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsBefore.apps).toHaveLength(2);

    // Delete apps by user-a
    await deleteApps({
      ...makeDeleteAppsArgs({
        query: {
          createdBy: { eq: "user1" },
        },
        deleteMany: true,
      }),
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only user app is deleted
    const appsAfter = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsAfter.apps).toHaveLength(1);
    expect(appsAfter.apps[0].name).toBe("System App");
    expect(appsAfter.apps[0].createdBy).toBe("system");
  });

  it("handles concurrent deletions", async () => {
    const app1Args = makeAddAppArgs({ name: "Concurrent App 1" });
    const app2Args = makeAddAppArgs({ name: "Concurrent App 2" });
    const app3Args = makeAddAppArgs({ name: "Concurrent App 3" });

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

    // Verify apps exist before deletion
    const appsBefore = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsBefore.apps).toHaveLength(3);

    // Delete apps concurrently
    const promises = [
      deleteApps({
        ...makeDeleteAppsArgs({
          query: {
            name: { eq: "Concurrent App 1" },
          },
        }),
        by: "deleter-1",
        byType: "user",
        storage,
      }),
      deleteApps({
        ...makeDeleteAppsArgs({
          query: {
            name: { eq: "Concurrent App 2" },
          },
        }),
        by: "deleter-2",
        byType: "user",
        storage,
      }),
      deleteApps({
        ...makeDeleteAppsArgs({
          query: {
            name: { eq: "Concurrent App 3" },
          },
        }),
        by: "deleter-3",
        byType: "user",
        storage,
      }),
    ];

    await Promise.all(promises);

    // Verify all apps are deleted
    const appsAfter = await getApps({
      args: {
        query: { orgId: defaultGroupId },
      },
      storage,
    });
    expect(appsAfter.apps).toHaveLength(0);
  });

  it("handles deleting apps across different groups", async () => {
    const app1Args = makeAddAppArgs({
      name: "Cross Group App 1",
      groupId: "group-1",
    });
    const app2Args = makeAddAppArgs({
      name: "Cross Group App 2",
      groupId: "group-2",
    });
    const app3Args = makeAddAppArgs({
      name: "Cross Group App 3",
      groupId: "group-1",
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

    // Verify apps exist before deletion
    const group1AppsBefore = await getApps({
      args: {
        query: { orgId: "group-1" },
      },
      storage,
    });
    expect(group1AppsBefore.apps).toHaveLength(2);

    const group2AppsBefore = await getApps({
      args: {
        query: { orgId: "group-2" },
      },
      storage,
    });
    expect(group2AppsBefore.apps).toHaveLength(1);

    // Delete apps in group-1
    await deleteApps({
      ...makeDeleteAppsArgs({
        query: {
          orgId: "group-1",
        },
        deleteMany: true,
      }),
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify group-1 apps are deleted
    const group1AppsAfter = await getApps({
      args: {
        query: { orgId: "group-1" },
      },
      storage,
    });
    expect(group1AppsAfter.apps).toHaveLength(0);

    // Verify group-2 app still exists
    const group2AppsAfter = await getApps({
      args: {
        query: { orgId: "group-2" },
      },
      storage,
    });
    expect(group2AppsAfter.apps).toHaveLength(1);
    expect(group2AppsAfter.apps[0].name).toBe("Cross Group App 2");
  });
});
