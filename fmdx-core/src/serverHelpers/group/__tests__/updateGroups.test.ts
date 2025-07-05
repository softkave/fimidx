import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { UpdateGroupsEndpointArgs } from "../../../definitions/group.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addGroup } from "../addGroup.js";
import { getGroups } from "../getGroups.js";
import { updateGroups } from "../updateGroups.js";

const defaultAppId = "test-app-updateGroups";
const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

function makeUpdateGroupsArgs(
  overrides: Partial<UpdateGroupsEndpointArgs> = {}
): UpdateGroupsEndpointArgs {
  return {
    update: {
      name: `Updated Group ${Math.random()}`,
      description: "Updated description",
      meta: { updatedKey: "updatedValue" },
    },
    query: {
      appId: defaultAppId,
    },
    ...overrides,
  };
}

function makeAddGroupArgs(overrides: any = {}) {
  return {
    name: `Test Group ${Math.random()}`,
    description: "Test description",
    appId: defaultAppId,
    meta: { key1: "value1", key2: "value2" },
    ...overrides,
  };
}

describe("updateGroups integration", () => {
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
        tag: kObjTags.group,
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
        tag: kObjTags.group,
        deletedBy: defaultBy,
        deletedByType: defaultByType,
        deleteMany: true,
        hardDelete: true, // Use hard delete for test cleanup
      });
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  it("updates a single group successfully", async () => {
    // First create a group
    const addArgs = makeAddGroupArgs({
      name: "Original Group",
      description: "Original description",
      meta: { originalKey: "originalValue" },
    });

    const createdGroup = await addGroup({
      args: addArgs,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Update the group
    const updateArgs = makeUpdateGroupsArgs({
      update: {
        name: "Updated Group Name",
        description: "Updated description",
        meta: { updatedKey: "updatedValue", newKey: "newValue" },
      },
      query: {
        appId: defaultAppId,
        id: { eq: createdGroup.group.id },
      },
    });

    await updateGroups({
      args: updateArgs,
      by: "updater",
      byType: "user",
      storage,
    });

    // Verify the update
    const getArgs = {
      query: {
        appId: defaultAppId,
        id: { eq: createdGroup.group.id },
      },
    };

    const result = await getGroups({ args: getArgs });
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].name).toBe("Updated Group Name");
    expect(result.groups[0].description).toBe("Updated description");
    expect(result.groups[0].meta).toEqual({
      updatedKey: "updatedValue",
      newKey: "newValue",
    });
    expect(result.groups[0].updatedBy).toBe("updater");
    expect(result.groups[0].updatedByType).toBe("user");
  });

  it("updates only specified fields", async () => {
    // Create a group
    const addArgs = makeAddGroupArgs({
      name: "Partial Update Group",
      description: "Original description",
      meta: { originalKey: "originalValue" },
    });

    const createdGroup = await addGroup({
      args: addArgs,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Update only the name
    const updateArgs = makeUpdateGroupsArgs({
      update: {
        name: "Only Name Updated",
      },
      query: {
        appId: defaultAppId,
        id: { eq: createdGroup.group.id },
      },
    });

    await updateGroups({
      args: updateArgs,
      by: "updater",
      byType: "user",
      storage,
    });

    // Verify only name was updated
    const getArgs = {
      query: {
        appId: defaultAppId,
        id: { eq: createdGroup.group.id },
      },
    };

    const result = await getGroups({ args: getArgs, storage });
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].name).toBe("Only Name Updated");
    expect(result.groups[0].description).toBe("Original description");
    expect(result.groups[0].meta).toEqual({ originalKey: "originalValue" });
  });

  it("updates multiple groups when updateMany is true", async () => {
    // Create multiple groups
    const group1 = await addGroup({
      args: makeAddGroupArgs({ name: "Group 1" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const group2 = await addGroup({
      args: makeAddGroupArgs({ name: "Group 2" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const group3 = await addGroup({
      args: makeAddGroupArgs({
        name: "Group 3",
        appId: "test-app-updateGroups-different",
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Update all groups in the default app
    const updateArgs = makeUpdateGroupsArgs({
      update: {
        description: "Updated for all groups",
        meta: { bulkUpdate: "true" },
      },
      query: {
        appId: defaultAppId,
      },
      updateMany: true,
    });

    await updateGroups({
      args: updateArgs,
      by: "bulk-updater",
      byType: "admin",
      storage,
    });

    // Verify all groups in the app were updated
    const getArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getGroups({ args: getArgs, storage });
    expect(result.groups).toHaveLength(2);

    // Check that both groups were updated
    const updatedGroups = result.groups.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    expect(updatedGroups[0].description).toBe("Updated for all groups");
    expect(updatedGroups[0].meta).toEqual({ bulkUpdate: "true" });
    expect(updatedGroups[1].description).toBe("Updated for all groups");
    expect(updatedGroups[1].meta).toEqual({ bulkUpdate: "true" });

    // Verify the group in different app was not updated
    const differentAppResult = await getGroups({
      args: { query: { appId: "test-app-updateGroups-different" } },
      storage,
    });
    expect(differentAppResult.groups).toHaveLength(1);
    expect(differentAppResult.groups[0].description).toBe("Test description");
    expect(differentAppResult.groups[0].meta).toEqual({
      key1: "value1",
      key2: "value2",
    });
  });

  it("updates groups by name query", async () => {
    // Create groups with different names
    await addGroup({
      args: makeAddGroupArgs({ name: "Target Group" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    await addGroup({
      args: makeAddGroupArgs({ name: "Other Group" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Update only groups with name "Target Group"
    const updateArgs = makeUpdateGroupsArgs({
      update: {
        description: "Updated by name query",
      },
      query: {
        appId: defaultAppId,
        name: { eq: "Target Group" },
      },
      updateMany: true,
    });

    await updateGroups({
      args: updateArgs,
      by: "name-updater",
      byType: "user",
      storage,
    });

    // Verify only the target group was updated
    const result = await getGroups({
      args: { query: { appId: defaultAppId } },
      storage,
    });
    expect(result.groups).toHaveLength(2);

    const targetGroup = result.groups.find((g) => g.name === "Target Group");
    const otherGroup = result.groups.find((g) => g.name === "Other Group");

    expect(targetGroup?.description).toBe("Updated by name query");
    expect(otherGroup?.description).toBe("Test description");
  });

  it("updates groups by createdBy query", async () => {
    // Create groups with different creators
    await addGroup({
      args: makeAddGroupArgs({ name: "Group by User A" }),
      by: "user-a",
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    await addGroup({
      args: makeAddGroupArgs({ name: "Group by User B" }),
      by: "user-b",
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Update only groups created by user-a
    const updateArgs = makeUpdateGroupsArgs({
      update: {
        meta: { updatedByCreator: "user-a" },
      },
      query: {
        appId: defaultAppId,
        createdBy: { eq: "user-a" },
      },
      updateMany: true,
    });

    await updateGroups({
      args: updateArgs,
      by: "meta-updater",
      byType: "admin",
      storage,
    });

    // Verify only user-a's groups were updated
    const result = await getGroups({
      args: { query: { appId: defaultAppId } },
      storage,
    });
    expect(result.groups).toHaveLength(2);

    const userAGroup = result.groups.find((g) => g.name === "Group by User A");
    const userBGroup = result.groups.find((g) => g.name === "Group by User B");

    expect(userAGroup?.meta).toEqual({ updatedByCreator: "user-a" });
    expect(userBGroup?.meta).toEqual({ key1: "value1", key2: "value2" });
  });

  it("handles empty update object", async () => {
    // Create a group
    const createdGroup = await addGroup({
      args: makeAddGroupArgs({ name: "Empty Update Test" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Update with empty object
    const updateArgs = makeUpdateGroupsArgs({
      update: {},
      query: {
        appId: defaultAppId,
        id: { eq: createdGroup.group.id },
      },
    });

    await updateGroups({
      args: updateArgs,
      by: "empty-updater",
      byType: "user",
      storage,
    });

    // Verify group remains unchanged except for updatedBy fields
    const getArgs = {
      query: {
        appId: defaultAppId,
        id: { eq: createdGroup.group.id },
      },
    };

    const result = await getGroups({ args: getArgs, storage });
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].name).toBe("Empty Update Test");
    expect(result.groups[0].updatedBy).toBe("empty-updater");
    expect(result.groups[0].updatedByType).toBe("user");
  });

  it("updates timestamp fields correctly", async () => {
    // Create a group
    const createdGroup = await addGroup({
      args: makeAddGroupArgs({ name: "Timestamp Test" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const beforeUpdate = new Date();

    // Update the group
    const updateArgs = makeUpdateGroupsArgs({
      update: {
        name: "Updated Timestamp Test",
      },
      query: {
        appId: defaultAppId,
        id: { eq: createdGroup.group.id },
      },
    });

    await updateGroups({
      args: updateArgs,
      by: "timestamp-updater",
      byType: "user",
      storage,
    });

    const afterUpdate = new Date();

    // Verify timestamps
    const getArgs = {
      query: {
        appId: defaultAppId,
        id: { eq: createdGroup.group.id },
      },
    };

    const result = await getGroups({ args: getArgs, storage });
    expect(result.groups).toHaveLength(1);

    const updatedGroup = result.groups[0];
    expect(updatedGroup.updatedAt.getTime()).toBeGreaterThanOrEqual(
      beforeUpdate.getTime()
    );
    expect(updatedGroup.updatedAt.getTime()).toBeLessThanOrEqual(
      afterUpdate.getTime()
    );
    expect(updatedGroup.createdAt.getTime()).toBe(
      createdGroup.group.createdAt.getTime()
    ); // createdAt should not change
  });

  it("handles special characters in updated fields", async () => {
    // Create a group
    const createdGroup = await addGroup({
      args: makeAddGroupArgs({ name: "Special Chars Test" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Update with special characters
    const updateArgs = makeUpdateGroupsArgs({
      update: {
        name: "Updated with special chars: !@#$%^&*()",
        description: "Updated with emojis 🚀 and symbols ©®™",
        meta: { specialKey: "value with spaces and symbols: !@#" },
      },
      query: {
        appId: defaultAppId,
        id: { eq: createdGroup.group.id },
      },
    });

    await updateGroups({
      args: updateArgs,
      by: "special-updater",
      byType: "user",
      storage,
    });

    // Verify special characters are preserved
    const getArgs = {
      query: {
        appId: defaultAppId,
        id: { eq: createdGroup.group.id },
      },
    };

    const result = await getGroups({ args: getArgs, storage });
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].name).toBe(
      "Updated with special chars: !@#$%^&*()"
    );
    expect(result.groups[0].description).toBe(
      "Updated with emojis 🚀 and symbols ©®™"
    );
    expect(result.groups[0].meta).toEqual({
      specialKey: "value with spaces and symbols: !@#",
    });
  });

  it("handles very long field values", async () => {
    // Create a group
    const createdGroup = await addGroup({
      args: makeAddGroupArgs({ name: "Long Values Test" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const longName = "A".repeat(1000);
    const longDescription = "B".repeat(2000);
    const longMetaValue = "C".repeat(500);

    // Update with long values
    const updateArgs = makeUpdateGroupsArgs({
      update: {
        name: longName,
        description: longDescription,
        meta: { longKey: longMetaValue },
      },
      query: {
        appId: defaultAppId,
        id: { eq: createdGroup.group.id },
      },
    });

    await updateGroups({
      args: updateArgs,
      by: "long-updater",
      byType: "user",
      storage,
    });

    // Verify long values are preserved
    const getArgs = {
      query: {
        appId: defaultAppId,
        id: { eq: createdGroup.group.id },
      },
    };

    const result = await getGroups({ args: getArgs, storage });
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].name).toBe(longName);
    expect(result.groups[0].description).toBe(longDescription);
    expect(result.groups[0].meta).toEqual({ longKey: longMetaValue });
  });

  it("fails gracefully when no groups match the query", async () => {
    // Try to update a non-existent group
    const updateArgs = makeUpdateGroupsArgs({
      update: {
        name: "This should not update anything",
      },
      query: {
        appId: defaultAppId,
        id: { eq: "non-existent-id" },
      },
    });

    // This should not throw an error, just not update anything
    await expect(
      updateGroups({
        args: updateArgs,
        by: "non-existent-updater",
        byType: "user",
        storage,
      })
    ).resolves.not.toThrow();

    // Verify no groups exist
    const result = await getGroups({
      args: { query: { appId: defaultAppId } },
      storage,
    });
    expect(result.groups).toHaveLength(0);
  });

  it("updates groups with complex meta queries", async () => {
    // Create groups with different meta values
    await addGroup({
      args: makeAddGroupArgs({
        name: "Meta Group 1",
        meta: { category: "tech", priority: "high" },
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    await addGroup({
      args: makeAddGroupArgs({
        name: "Meta Group 2",
        meta: { category: "tech", priority: "low" },
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    await addGroup({
      args: makeAddGroupArgs({
        name: "Meta Group 3",
        meta: { category: "design", priority: "high" },
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Update only tech groups with high priority
    const updateArgs = makeUpdateGroupsArgs({
      update: {
        meta: { category: "tech", priority: "high", updated: "true" },
      },
      query: {
        appId: defaultAppId,
        meta: [
          { op: "eq", field: "category", value: "tech" },
          { op: "eq", field: "priority", value: "high" },
        ],
      },
      updateMany: true,
    });

    await updateGroups({
      args: updateArgs,
      by: "meta-complex-updater",
      byType: "admin",
      storage,
    });

    // Verify only the matching group was updated
    const result = await getGroups({
      args: { query: { appId: defaultAppId } },
      storage,
    });
    expect(result.groups).toHaveLength(3);

    const techHighGroup = result.groups.find((g) => g.name === "Meta Group 1");
    const techLowGroup = result.groups.find((g) => g.name === "Meta Group 2");
    const designHighGroup = result.groups.find(
      (g) => g.name === "Meta Group 3"
    );

    expect(techHighGroup?.meta).toEqual({
      category: "tech",
      priority: "high",
      updated: "true",
    });
    expect(techLowGroup?.meta).toEqual({ category: "tech", priority: "low" });
    expect(designHighGroup?.meta).toEqual({
      category: "design",
      priority: "high",
    });
  });
});
