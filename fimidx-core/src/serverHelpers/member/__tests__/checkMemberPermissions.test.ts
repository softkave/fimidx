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
import { addMember } from "../addMember.js";
import { addMemberPermissions } from "../addMemberPermissions.js";
import { checkMemberPermissions } from "../checkMemberPermissions.js";

const defaultAppId = "test-app-checkMemberPermissions";
const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

// Test counter to ensure unique names
let testCounter = 0;

function makeAddMemberArgs(overrides: any = {}) {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    groupId: defaultGroupId,
    appId: defaultAppId,
    email: `test-${uniqueId}@example.com`,
    memberId: `member-${uniqueId}`,
    permissions: [],
    ...overrides,
  };
}

function makeAddMemberPermissionsArgs(overrides: any = {}) {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
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
    memberId: `member-${uniqueId}`,
    ...overrides,
  };
}

function makeCheckMemberPermissionsArgs(overrides: any = {}) {
  return {
    appId: defaultAppId,
    memberId: "test-member-id",
    groupId: defaultGroupId,
    items: [
      {
        entity: "user",
        action: "read",
        target: "document",
      },
    ],
    ...overrides,
  };
}

describe("checkMemberPermissions integration", () => {
  let storage: IObjStorage;
  let cleanup: (() => Promise<void>) | undefined;

  beforeAll(async () => {
    storage = createDefaultStorage();

    if (
      process.env.FIMIDX_STORAGE_TYPE === "mongo" ||
      !process.env.FIMIDX_STORAGE_TYPE
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
        "test-app-checkMemberPermissions-1",
        "test-app-checkMemberPermissions-2",
      ];
      for (const appId of testAppIds) {
        await storage.bulkDelete({
          query: { appId },
          tag: kObjTags.member,
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
        "test-app-checkMemberPermissions-1",
        "test-app-checkMemberPermissions-2",
      ];
      for (const appId of testAppIds) {
        await storage.bulkDelete({
          query: { appId },
          tag: kObjTags.member,
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

  it("returns true for permissions that exist", async () => {
    // First create a member
    const memberArgs = makeAddMemberArgs();
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Add permissions to the member
    const permissionsArgs = makeAddMemberPermissionsArgs({
      memberId: member.member.memberId,
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

    await addMemberPermissions(permissionsArgs);

    // Check if the member has the permissions
    const checkArgs = makeCheckMemberPermissionsArgs({
      memberId: member.member.memberId,
      items: [
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

    const result = await checkMemberPermissions({
      args: checkArgs,
      storage,
    });

    expect(result.results).toHaveLength(2);
    expect(result.results[0].hasPermission).toBe(true);
    expect(result.results[1].hasPermission).toBe(true);
  });

  it("returns false for permissions that don't exist", async () => {
    // First create a member
    const memberArgs = makeAddMemberArgs();
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Add some permissions to the member
    const permissionsArgs = makeAddMemberPermissionsArgs({
      memberId: member.member.memberId,
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
      ],
    });

    await addMemberPermissions(permissionsArgs);

    // Check for permissions that don't exist
    const checkArgs = makeCheckMemberPermissionsArgs({
      memberId: member.member.memberId,
      items: [
        {
          entity: "user",
          action: "write",
          target: "document",
        },
        {
          entity: "admin",
          action: "delete",
          target: "settings",
        },
      ],
    });

    const result = await checkMemberPermissions({
      args: checkArgs,
      storage,
    });

    expect(result.results).toHaveLength(2);
    expect(result.results[0].hasPermission).toBe(false);
    expect(result.results[1].hasPermission).toBe(false);
  });

  it("handles mixed permissions (some exist, some don't)", async () => {
    // First create a member
    const memberArgs = makeAddMemberArgs();
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Add some permissions to the member
    const permissionsArgs = makeAddMemberPermissionsArgs({
      memberId: member.member.memberId,
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

    await addMemberPermissions(permissionsArgs);

    // Check for mixed permissions
    const checkArgs = makeCheckMemberPermissionsArgs({
      memberId: member.member.memberId,
      items: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
        {
          entity: "user",
          action: "write",
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
          target: "settings",
        },
      ],
    });

    const result = await checkMemberPermissions({
      args: checkArgs,
      storage,
    });

    expect(result.results).toHaveLength(4);
    expect(result.results[0].hasPermission).toBe(true); // user:read:document
    expect(result.results[1].hasPermission).toBe(false); // user:write:document
    expect(result.results[2].hasPermission).toBe(true); // admin:write:settings
    expect(result.results[3].hasPermission).toBe(false); // admin:delete:settings
  });

  it("handles empty items array", async () => {
    const checkArgs = makeCheckMemberPermissionsArgs({
      items: [],
    });

    const result = await checkMemberPermissions({
      args: checkArgs,
      storage,
    });

    expect(result.results).toHaveLength(0);
  });

  it("handles object-based permission entities, actions, and targets", async () => {
    // First create a member
    const memberArgs = makeAddMemberArgs();
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Add permissions with object-based entities, actions, and targets
    const permissionsArgs = makeAddMemberPermissionsArgs({
      memberId: member.member.memberId,
      permissions: [
        {
          entity: { type: "user", id: "123" },
          action: { operation: "read", scope: "full" },
          target: { resource: "document", id: "doc-1" },
        },
      ],
    });

    await addMemberPermissions(permissionsArgs);

    // Check for the same object-based permissions
    const checkArgs = makeCheckMemberPermissionsArgs({
      memberId: member.member.memberId,
      items: [
        {
          entity: { type: "user", id: "123" },
          action: { operation: "read", scope: "full" },
          target: { resource: "document", id: "doc-1" },
        },
        {
          entity: { type: "user", id: "456" },
          action: { operation: "read", scope: "full" },
          target: { resource: "document", id: "doc-1" },
        },
      ],
    });

    const result = await checkMemberPermissions({
      args: checkArgs,
      storage,
    });

    expect(result.results).toHaveLength(2);
    expect(result.results[0].hasPermission).toBe(true);
    expect(result.results[1].hasPermission).toBe(false);
  });

  it("handles different group IDs correctly", async () => {
    // First create a member
    const memberArgs = makeAddMemberArgs();
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Add permissions to the member in the default group
    const permissionsArgs = makeAddMemberPermissionsArgs({
      memberId: member.member.memberId,
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
      ],
    });

    await addMemberPermissions(permissionsArgs);

    // Check for permissions in a different group
    const checkArgs = makeCheckMemberPermissionsArgs({
      memberId: member.member.memberId,
      groupId: "different-group",
      items: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
      ],
    });

    const result = await checkMemberPermissions({
      args: checkArgs,
      storage,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].hasPermission).toBe(false);
  });
});
