import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { DeleteGroupsEndpointArgs } from "../../../definitions/group.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addGroup } from "../addGroup.js";
import { deleteGroups } from "../deleteGroups.js";
import { getGroups } from "../getGroups.js";

const defaultAppId = "test-app-deleteGroups";
const defaultBy = "tester";
const defaultByType = "user";

function makeDeleteGroupsArgs(
  overrides: Partial<DeleteGroupsEndpointArgs> = {}
): DeleteGroupsEndpointArgs {
  return {
    query: {
      appId: defaultAppId,
      ...overrides.query,
    },
    deleteMany: overrides.deleteMany,
  };
}

function makeAddGroupArgs(overrides: any = {}) {
  return {
    name: `Test Group ${Math.random()}`,
    description: "Test description",
    appId: defaultAppId,
    ...overrides,
  };
}

describe("deleteGroups integration", () => {
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

  it("deletes a single group by id", async () => {
    // First create a group
    const addArgs = makeAddGroupArgs({
      name: "Group to Delete",
      description: "This group will be deleted",
    });

    const addResult = await addGroup({
      args: addArgs,
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-1",
      storage,
    });

    const groupId = addResult.group.id;

    // Verify the group exists
    const groupsBefore = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
      storage,
    });
    expect(groupsBefore.groups).toHaveLength(1);
    expect(groupsBefore.groups[0].id).toBe(groupId);

    // Delete the group
    const deleteArgs = makeDeleteGroupsArgs({
      query: {
        appId: defaultAppId,
        id: { eq: groupId },
      },
    });

    await deleteGroups({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify the group is deleted
    const groupsAfter = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
      storage,
    });
    expect(groupsAfter.groups).toHaveLength(0);
  });

  it("deletes multiple groups by name", async () => {
    // Create multiple groups
    const group1 = await addGroup({
      args: makeAddGroupArgs({ name: "Delete Me Group 1" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-1",
      storage,
    });

    const group2 = await addGroup({
      args: makeAddGroupArgs({ name: "Delete Me Group 2" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-2",
      storage,
    });

    const group3 = await addGroup({
      args: makeAddGroupArgs({ name: "Keep Me Group" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-3",
      storage,
    });

    // Verify all groups exist
    const groupsBefore = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
      storage,
    });
    expect(groupsBefore.groups).toHaveLength(3);

    // Delete the first group by name
    const deleteArgs = makeDeleteGroupsArgs({
      query: {
        appId: defaultAppId,
        name: { eq: "Delete Me Group 1" },
      },
      deleteMany: true,
    });

    await deleteGroups({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
    });

    // Verify only the first group is deleted
    const groupsAfter = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
    });
    expect(groupsAfter.groups).toHaveLength(2);

    const remainingNames = groupsAfter.groups.map((g) => g.name).sort();
    expect(remainingNames).toEqual(["Delete Me Group 2", "Keep Me Group"]);
  });

  it("deletes groups by createdBy", async () => {
    // Create groups with different creators
    const group1 = await addGroup({
      args: makeAddGroupArgs({ name: "Group by User A" }),
      by: "user-a",
      byType: "user",
      groupId: "test-group-1",
      storage,
    });

    const group2 = await addGroup({
      args: makeAddGroupArgs({ name: "Group by User B" }),
      by: "user-b",
      byType: "user",
      groupId: "test-group-2",
      storage,
    });

    const group3 = await addGroup({
      args: makeAddGroupArgs({ name: "Another Group by User A" }),
      by: "user-a",
      byType: "user",
      groupId: "test-group-3",
      storage,
    });

    // Verify all groups exist
    const groupsBefore = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
      storage,
    });
    expect(groupsBefore.groups).toHaveLength(3);

    // Delete groups created by user-a
    const deleteArgs = makeDeleteGroupsArgs({
      query: {
        appId: defaultAppId,
        createdBy: { eq: "user-a" },
      },
      deleteMany: true,
    });

    await deleteGroups({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only user-a's groups are deleted
    const groupsAfter = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
      storage,
    });
    expect(groupsAfter.groups).toHaveLength(1);
    expect(groupsAfter.groups[0].createdBy).toBe("user-b");
  });

  it("deletes groups by meta field", async () => {
    // Create groups with different meta data
    const group1 = await addGroup({
      args: makeAddGroupArgs({
        name: "Group with Meta A",
        meta: { category: "important", priority: "high" },
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-1",
      storage,
    });

    const group2 = await addGroup({
      args: makeAddGroupArgs({
        name: "Group with Meta B",
        meta: { category: "important", priority: "low" },
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-2",
      storage,
    });

    const group3 = await addGroup({
      args: makeAddGroupArgs({
        name: "Group with Meta C",
        meta: { category: "unimportant", priority: "high" },
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-3",
      storage,
    });

    // Verify all groups exist
    const groupsBefore = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
      storage,
    });
    expect(groupsBefore.groups).toHaveLength(3);

    // Delete groups with category "important"
    const deleteArgs = makeDeleteGroupsArgs({
      query: {
        appId: defaultAppId,
        meta: [
          {
            op: "eq",
            field: "category",
            value: "important",
          },
        ],
      },
      deleteMany: true,
    });

    await deleteGroups({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only groups with category "important" are deleted
    const groupsAfter = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
      storage,
    });
    expect(groupsAfter.groups).toHaveLength(1);
    expect(groupsAfter.groups[0].meta?.category).toBe("unimportant");
  });

  it("deletes groups by date range", async () => {
    // Create groups at different times
    const group1 = await addGroup({
      args: makeAddGroupArgs({ name: "Old Group" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-1",
      storage,
    });

    // Wait a bit to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));

    const group2 = await addGroup({
      args: makeAddGroupArgs({ name: "New Group" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-2",
      storage,
    });

    // Verify all groups exist
    const groupsBefore = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
      storage,
    });
    expect(groupsBefore.groups).toHaveLength(2);

    // Delete groups created before the second group
    const deleteArgs = makeDeleteGroupsArgs({
      query: {
        appId: defaultAppId,
        createdAt: { lt: group2.group.createdAt.getTime() },
      },
      deleteMany: true,
    });

    await deleteGroups({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only the newer group remains
    const groupsAfter = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
      storage,
    });
    expect(groupsAfter.groups).toHaveLength(1);
    expect(groupsAfter.groups[0].name).toBe("New Group");
  });

  it("deletes all groups in an app", async () => {
    // Create multiple groups
    const group1 = await addGroup({
      args: makeAddGroupArgs({ name: "Group 1" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-1",
      storage,
    });

    const group2 = await addGroup({
      args: makeAddGroupArgs({ name: "Group 2" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-2",
      storage,
    });

    const group3 = await addGroup({
      args: makeAddGroupArgs({ name: "Group 3" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-3",
      storage,
    });

    // Verify all groups exist
    const groupsBefore = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
      storage,
    });
    expect(groupsBefore.groups).toHaveLength(3);

    // Delete all groups in the app
    const deleteArgs = makeDeleteGroupsArgs({
      query: {
        appId: defaultAppId,
      },
      deleteMany: true,
    });

    await deleteGroups({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify all groups are deleted
    const groupsAfter = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
      storage,
    });
    expect(groupsAfter.groups).toHaveLength(0);
  });

  it("handles deletion of non-existent groups gracefully", async () => {
    // Try to delete a group that doesn't exist
    const deleteArgs = makeDeleteGroupsArgs({
      query: {
        appId: defaultAppId,
        id: { eq: "non-existent-id" },
      },
    });

    // This should not throw an error
    await expect(
      deleteGroups({
        ...deleteArgs,
        by: defaultBy,
        byType: defaultByType,
      })
    ).resolves.not.toThrow();
  });

  it("handles complex meta queries", async () => {
    // Create groups with complex meta data
    const group1 = await addGroup({
      args: makeAddGroupArgs({
        name: "Complex Meta Group 1",
        meta: {
          status: "active",
          type: "premium",
          region: "us-east",
        },
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-1",
    });

    const group2 = await addGroup({
      args: makeAddGroupArgs({
        name: "Complex Meta Group 2",
        meta: {
          status: "inactive",
          type: "premium",
          region: "us-west",
        },
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-2",
    });

    const group3 = await addGroup({
      args: makeAddGroupArgs({
        name: "Complex Meta Group 3",
        meta: {
          status: "active",
          type: "basic",
          region: "us-east",
        },
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-3",
    });

    // Verify all groups exist
    const groupsBefore = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
    });
    expect(groupsBefore.groups).toHaveLength(3);

    // Delete groups with status "active" AND type "premium"
    const deleteArgs = makeDeleteGroupsArgs({
      query: {
        appId: defaultAppId,
        meta: [
          {
            op: "eq",
            field: "status",
            value: "active",
          },
          {
            op: "eq",
            field: "type",
            value: "premium",
          },
        ],
      },
      deleteMany: true,
    });

    await deleteGroups({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
    });

    // Verify only the matching group is deleted
    const groupsAfter = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
    });
    expect(groupsAfter.groups).toHaveLength(2);

    const remainingNames = groupsAfter.groups.map((g) => g.name).sort();
    expect(remainingNames).toEqual([
      "Complex Meta Group 2",
      "Complex Meta Group 3",
    ]);
  });

  it("preserves groups in other apps when deleting by appId", async () => {
    // Create groups in different apps
    const group1 = await addGroup({
      args: makeAddGroupArgs({
        name: "Group in App 1",
        appId: "test-app-deleteGroups-1",
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-1",
    });

    const group2 = await addGroup({
      args: makeAddGroupArgs({
        name: "Group in App 2",
        appId: "test-app-deleteGroups-2",
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-2",
    });

    const group3 = await addGroup({
      args: makeAddGroupArgs({
        name: "Group in Default App",
        appId: defaultAppId,
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: "test-group-3",
    });

    // Verify all groups exist
    const allGroupsBefore = await getGroups({
      args: {
        query: { appId: "test-app-deleteGroups-1" },
      },
    });
    expect(allGroupsBefore.groups).toHaveLength(1);

    // Delete groups in app-1
    const deleteArgs = makeDeleteGroupsArgs({
      query: {
        appId: "test-app-deleteGroups-1",
      },
      deleteMany: true,
    });

    await deleteGroups({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
    });

    // Verify only app-1 groups are deleted
    const app1GroupsAfter = await getGroups({
      args: {
        query: { appId: "test-app-deleteGroups-1" },
      },
    });
    expect(app1GroupsAfter.groups).toHaveLength(0);

    const app2GroupsAfter = await getGroups({
      args: {
        query: { appId: "test-app-deleteGroups-2" },
      },
    });
    expect(app2GroupsAfter.groups).toHaveLength(1);

    const defaultAppGroupsAfter = await getGroups({
      args: {
        query: { appId: defaultAppId },
      },
    });
    expect(defaultAppGroupsAfter.groups).toHaveLength(1);
  });
});
