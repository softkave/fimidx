import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addMember } from "../addMember.js";
import { addMemberPermissions } from "../addMemberPermissions.js";

const defaultAppId = "test-app-addMemberPermissions";
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
    name: `Test Member ${uniqueId}`,
    description: "Test description",
    appId: defaultAppId,
    groupId: defaultGroupId,
    email: `test${uniqueId}@example.com`,
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

describe("addMemberPermissions integration", () => {
  let storage: IObjStorage;

  beforeAll(async () => {
    storage = createDefaultStorage();
  });

  beforeEach(async () => {
    try {
      const testAppIds = [
        defaultAppId,
        "test-app-addMemberPermissions-1",
        "test-app-addMemberPermissions-2",
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
        "test-app-addMemberPermissions-1",
        "test-app-addMemberPermissions-2",
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

  it("adds permissions to a member successfully", async () => {
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

    const result = await addMemberPermissions(permissionsArgs);

    expect(result.permissions).toBeDefined();
    expect(result.permissions).toHaveLength(2);

    // Verify the permissions are properly managed with member-specific metadata
    const permission1 = result.permissions[0];
    const permission2 = result.permissions[1];

    expect(permission1.meta).toBeDefined();
    expect(permission1.meta?.__fimidx_managed_memberId).toBe(
      member.member.memberId
    );
    expect(permission1.meta?.__fimidx_managed_groupId).toBe(defaultGroupId);

    expect(permission2.meta).toBeDefined();
    expect(permission2.meta?.__fimidx_managed_memberId).toBe(
      member.member.memberId
    );
    expect(permission2.meta?.__fimidx_managed_groupId).toBe(defaultGroupId);

    // Verify the entity, action, and target are properly managed
    expect(permission1.entity).toContain("__fimidx_managed_permission_entity_");
    expect(permission1.action).toContain("__fimidx_managed_permission_action_");
    expect(permission1.target).toContain("__fimidx_managed_permission_target_");

    expect(permission2.entity).toContain("__fimidx_managed_permission_entity_");
    expect(permission2.action).toContain("__fimidx_managed_permission_action_");
    expect(permission2.target).toContain("__fimidx_managed_permission_target_");
  });

  it("adds permissions with complex entity, action, and target objects", async () => {
    const memberArgs = makeAddMemberArgs();
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const permissionsArgs = makeAddMemberPermissionsArgs({
      memberId: member.member.memberId,
      permissions: [
        {
          entity: { type: "user", id: "123" },
          action: { operation: "read", scope: "document" },
          target: { resource: "document", id: "456" },
        },
      ],
    });

    const result = await addMemberPermissions(permissionsArgs);

    expect(result.permissions).toBeDefined();
    expect(result.permissions).toHaveLength(1);

    const permission = result.permissions[0];
    expect(permission.meta).toBeDefined();
    expect(permission.meta?.__fimidx_managed_memberId).toBe(
      member.member.memberId
    );
    expect(permission.meta?.__fimidx_managed_groupId).toBe(defaultGroupId);

    // Verify complex objects are properly managed
    expect(permission.entity).toHaveProperty(
      "__fimidx_managed_permission_entity_memberId"
    );
    expect(permission.action).toHaveProperty(
      "__fimidx_managed_permission_action_memberId"
    );
    expect(permission.target).toHaveProperty(
      "__fimidx_managed_permission_target_memberId"
    );
  });

  it("adds empty permissions array", async () => {
    const memberArgs = makeAddMemberArgs();
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const permissionsArgs = makeAddMemberPermissionsArgs({
      memberId: member.member.memberId,
      permissions: [],
    });

    const result = await addMemberPermissions(permissionsArgs);

    expect(result.permissions).toBeDefined();
    expect(result.permissions).toHaveLength(0);
  });

  it("adds permissions with different member IDs", async () => {
    // Create two members
    const member1Args = makeAddMemberArgs({ memberId: "member-1" });
    const member2Args = makeAddMemberArgs({ memberId: "member-2" });

    const member1 = await addMember({
      args: member1Args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const member2 = await addMember({
      args: member2Args,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Add permissions to both members
    const permissions1Args = makeAddMemberPermissionsArgs({
      memberId: member1.member.memberId,
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
      ],
    });

    const permissions2Args = makeAddMemberPermissionsArgs({
      memberId: member2.member.memberId,
      permissions: [
        {
          entity: "admin",
          action: "write",
          target: "settings",
        },
      ],
    });

    const result1 = await addMemberPermissions(permissions1Args);
    const result2 = await addMemberPermissions(permissions2Args);

    expect(result1.permissions).toHaveLength(1);
    expect(result2.permissions).toHaveLength(1);

    expect(result1.permissions[0].meta?.__fimidx_managed_memberId).toBe(
      member1.member.memberId
    );
    expect(result2.permissions[0].meta?.__fimidx_managed_memberId).toBe(
      member2.member.memberId
    );
  });

  it("adds permissions with different group IDs", async () => {
    const memberArgs = makeAddMemberArgs();
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const permissionsArgs = makeAddMemberPermissionsArgs({
      memberId: member.member.memberId,
      groupId: "different-group",
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
      ],
    });

    const result = await addMemberPermissions(permissionsArgs);

    expect(result.permissions).toHaveLength(1);
    expect(result.permissions[0].meta?.__fimidx_managed_groupId).toBe(
      "different-group"
    );
  });

  it("adds permissions with different app IDs", async () => {
    const memberArgs = makeAddMemberArgs();
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const permissionsArgs = makeAddMemberPermissionsArgs({
      memberId: member.member.memberId,
      appId: "different-app",
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
      ],
    });

    const result = await addMemberPermissions(permissionsArgs);

    expect(result.permissions).toHaveLength(1);
    expect(result.permissions[0].appId).toBe("different-app");
  });

  it("adds permissions with different by/byType values", async () => {
    const memberArgs = makeAddMemberArgs();
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const permissionsArgs = makeAddMemberPermissionsArgs({
      memberId: member.member.memberId,
      by: "different-user",
      byType: "admin",
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
      ],
    });

    const result = await addMemberPermissions(permissionsArgs);

    expect(result.permissions).toHaveLength(1);
    expect(result.permissions[0].createdBy).toBe("different-user");
    expect(result.permissions[0].createdByType).toBe("admin");
  });
});
