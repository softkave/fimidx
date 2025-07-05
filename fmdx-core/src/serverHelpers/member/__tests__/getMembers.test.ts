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
import type { GetMembersEndpointArgs } from "../../../definitions/member.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addMember } from "../addMember.js";
import { getMembers } from "../getMembers.js";

const defaultAppId = "test-app-getMembers";
const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

// Test counter to ensure unique names
let testCounter = 0;

function makeGetMembersArgs(
  overrides: Partial<GetMembersEndpointArgs> = {}
): GetMembersEndpointArgs {
  return {
    query: {
      appId: defaultAppId,
      groupId: defaultGroupId,
      ...overrides.query,
    },
    page: overrides.page,
    limit: overrides.limit,
    sort: overrides.sort,
  };
}

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

// Helper function to create members with specific names for testing
function makeTestMemberArgs(name: string, overrides: any = {}) {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    name: `${name}_${uniqueId}`,
    description: "Test description",
    appId: defaultAppId,
    groupId: defaultGroupId,
    email: `test${uniqueId}@example.com`,
    memberId: `member-${uniqueId}`,
    permissions: [],
    ...overrides,
  };
}

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

describe("getMembers integration", () => {
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
      // Delete all members for all test apps using hard deletes
      const testAppIds = [
        defaultAppId,
        "test-app-getMembers-1",
        "test-app-getMembers-2",
      ];
      for (const appId of testAppIds) {
        await storage.bulkDelete({
          query: { appId },
          tag: kObjTags.member,
          deletedBy: defaultBy,
          deletedByType: defaultByType,
          deleteMany: true,
          hardDelete: true, // Use hard delete for test cleanup
        });
      }

      // Clean up objFields for test apps
      for (const appId of testAppIds) {
        await db
          .delete(objFieldsTable)
          .where(
            and(
              eq(objFieldsTable.appId, appId),
              eq(objFieldsTable.tag, kObjTags.member)
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
      // Delete all members for all test apps using hard deletes
      const testAppIds = [
        defaultAppId,
        "test-app-getMembers-1",
        "test-app-getMembers-2",
      ];
      for (const appId of testAppIds) {
        await storage.bulkDelete({
          query: { appId },
          tag: kObjTags.member,
          deletedBy: defaultBy,
          deletedByType: defaultByType,
          deleteMany: true,
          hardDelete: true, // Use hard delete for test cleanup
        });
      }

      // Clean up objFields for test apps
      for (const appId of testAppIds) {
        await db
          .delete(objFieldsTable)
          .where(
            and(
              eq(objFieldsTable.appId, appId),
              eq(objFieldsTable.tag, kObjTags.member)
            )
          );
      }
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  it("returns empty array when no members exist", async () => {
    const args = makeGetMembersArgs();

    const result = await getMembers({
      args,
      includePermissions: false,
      storage,
    });

    expect(result.members).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
  });

  it("returns members when they exist", async () => {
    // Create test members
    const member1Args = makeAddMemberArgs({ name: "Member A" });
    const member2Args = makeAddMemberArgs({ name: "Member B" });

    await addMember({
      args: member1Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member1Args.memberId,
      storage,
    });

    await addMember({
      args: member2Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member2Args.memberId,
      storage,
    });

    const args = makeGetMembersArgs();
    const result = await getMembers({
      args,
      includePermissions: false,
      storage,
    });

    expect(result.members).toHaveLength(2);
    expect(result.hasMore).toBe(false);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);

    // Verify member properties
    const memberNames = result.members.map((m) => m.name).sort();
    expect(memberNames).toEqual(["Member A", "Member B"].sort());
  });

  it("filters by name", async () => {
    // Create test members
    const member1Args = makeAddMemberArgs({ name: "Alice Member" });
    const member2Args = makeAddMemberArgs({ name: "Bob Member" });

    await addMember({
      args: member1Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member1Args.memberId,
      storage,
    });

    await addMember({
      args: member2Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member2Args.memberId,
      storage,
    });

    const args = makeGetMembersArgs({
      query: {
        appId: defaultAppId,
        groupId: defaultGroupId,
        name: { eq: "Alice Member" },
      },
    });

    const result = await getMembers({
      args,
      includePermissions: false,
      storage,
    });

    expect(result.members).toHaveLength(1);
    expect(result.members[0].name).toBe("Alice Member");
  });

  it("filters by email", async () => {
    // Create test members
    const member1Args = makeAddMemberArgs({
      name: "Alice",
      email: "alice@example.com",
    });
    const member2Args = makeAddMemberArgs({
      name: "Bob",
      email: "bob@example.com",
    });

    await addMember({
      args: member1Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member1Args.memberId,
      storage,
    });

    await addMember({
      args: member2Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member2Args.memberId,
      storage,
    });

    const args = makeGetMembersArgs({
      query: {
        appId: defaultAppId,
        groupId: defaultGroupId,
        email: { eq: "alice@example.com" },
      },
    });

    const result = await getMembers({
      args,
      includePermissions: false,
      storage,
    });

    expect(result.members).toHaveLength(1);
    expect(result.members[0].email).toBe("alice@example.com");
  });

  it("filters by memberId", async () => {
    // Create test members
    const member1Args = makeAddMemberArgs({
      name: "Alice",
      memberId: "alice-123",
    });
    const member2Args = makeAddMemberArgs({
      name: "Bob",
      memberId: "bob-456",
    });

    await addMember({
      args: member1Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member1Args.memberId,
      storage,
    });

    await addMember({
      args: member2Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member2Args.memberId,
      storage,
    });

    const args = makeGetMembersArgs({
      query: {
        appId: defaultAppId,
        groupId: defaultGroupId,
        memberId: { eq: "alice-123" },
      },
    });

    const result = await getMembers({
      args,
      includePermissions: false,
      storage,
    });

    expect(result.members).toHaveLength(1);
    expect(result.members[0].memberId).toBe("alice-123");
  });

  it("filters by groupId", async () => {
    // Create test members in different groups
    const member1Args = makeAddMemberArgs({
      name: "Alice",
      groupId: "group-1",
    });
    const member2Args = makeAddMemberArgs({
      name: "Bob",
      groupId: "group-2",
    });

    await addMember({
      args: member1Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member1Args.memberId,
      storage,
    });

    await addMember({
      args: member2Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member2Args.memberId,
      storage,
    });

    const args = makeGetMembersArgs({
      query: {
        appId: defaultAppId,
        groupId: "group-1",
      },
    });

    const result = await getMembers({
      args,
      includePermissions: false,
      storage,
    });

    expect(result.members).toHaveLength(1);
    expect(result.members[0].groupId).toBe("group-1");
  });

  it("handles pagination correctly", async () => {
    // Create multiple test members
    const members = [];
    for (let i = 0; i < 5; i++) {
      const memberArgs = makeAddMemberArgs({ name: `Member ${i}` });
      members.push(memberArgs);

      await addMember({
        args: memberArgs,
        by: defaultBy,
        byType: defaultByType,
        memberId: memberArgs.memberId,
        storage,
      });
    }

    // Test first page
    const args1 = makeGetMembersArgs({ page: 1, limit: 2 });
    const result1 = await getMembers({
      args: args1,
      includePermissions: false,
      storage,
    });

    expect(result1.members).toHaveLength(2);
    expect(result1.hasMore).toBe(true);
    expect(result1.page).toBe(1);
    expect(result1.limit).toBe(2);

    // Test second page
    const args2 = makeGetMembersArgs({ page: 2, limit: 2 });
    const result2 = await getMembers({
      args: args2,
      includePermissions: false,
      storage,
    });

    expect(result2.members).toHaveLength(2);
    expect(result2.hasMore).toBe(true);
    expect(result2.page).toBe(2);
    expect(result2.limit).toBe(2);

    // Test third page
    const args3 = makeGetMembersArgs({ page: 3, limit: 2 });
    const result3 = await getMembers({
      args: args3,
      includePermissions: false,
      storage,
    });

    expect(result3.members).toHaveLength(1);
    expect(result3.hasMore).toBe(false);
    expect(result3.page).toBe(3);
    expect(result3.limit).toBe(2);
  });

  it("sorts by name when objFields are set up", async () => {
    // Set up objFields for name sorting
    await insertNameFieldForSorting({
      appId: defaultAppId,
      groupId: defaultGroupId,
      tag: kObjTags.member,
    });

    // Create test members
    const member1Args = makeAddMemberArgs({ name: "Charlie" });
    const member2Args = makeAddMemberArgs({ name: "Alice" });
    const member3Args = makeAddMemberArgs({ name: "Bob" });

    await addMember({
      args: member1Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member1Args.memberId,
      storage,
    });

    await addMember({
      args: member2Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member2Args.memberId,
      storage,
    });

    await addMember({
      args: member3Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member3Args.memberId,
      storage,
    });

    // Test ascending sort
    const argsAsc = makeGetMembersArgs({
      sort: [{ field: "name", direction: "asc" }],
    });
    const resultAsc = await getMembers({
      args: argsAsc,
      includePermissions: false,
      storage,
    });

    expect(resultAsc.members.map((m) => m.name)).toEqual([
      "Alice",
      "Bob",
      "Charlie",
    ]);

    // Test descending sort
    const argsDesc = makeGetMembersArgs({
      sort: [{ field: "name", direction: "desc" }],
    });
    const resultDesc = await getMembers({
      args: argsDesc,
      includePermissions: false,
      storage,
    });

    expect(resultDesc.members.map((m) => m.name)).toEqual([
      "Charlie",
      "Bob",
      "Alice",
    ]);
  });

  it("includes permissions when requested", async () => {
    // Create test member with permissions
    const memberArgs = makeAddMemberArgs({
      permissions: [
        {
          entity: "test",
          action: "read",
          target: "data",
        },
      ],
    });

    await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      memberId: memberArgs.memberId,
      storage,
    });

    const args = makeGetMembersArgs();
    const result = await getMembers({
      args,
      includePermissions: true,
      storage,
    });

    expect(result.members).toHaveLength(1);
    expect(result.members[0].permissions).not.toBeNull();
    expect(result.members[0].permissions).toHaveLength(1);
    expect(result.members[0].permissions![0]).toEqual({
      entity: "test",
      action: "read",
      target: "data",
    });
  });

  it("excludes permissions when not requested", async () => {
    // Create test member with permissions
    const memberArgs = makeAddMemberArgs({
      permissions: [
        {
          entity: "test",
          action: "read",
          target: "data",
        },
      ],
    });

    await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      memberId: memberArgs.memberId,
      storage,
    });

    const args = makeGetMembersArgs();
    const result = await getMembers({
      args,
      includePermissions: false,
      storage,
    });

    expect(result.members).toHaveLength(1);
    expect(result.members[0].permissions).toBeNull();
  });

  it("filters by meta fields", async () => {
    // Create test members with meta
    const member1Args = makeAddMemberArgs({
      name: "Alice",
      meta: { department: "engineering", level: "senior" },
    });
    const member2Args = makeAddMemberArgs({
      name: "Bob",
      meta: { department: "marketing", level: "junior" },
    });

    await addMember({
      args: member1Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member1Args.memberId,
      storage,
    });

    await addMember({
      args: member2Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member2Args.memberId,
      storage,
    });

    const args = makeGetMembersArgs({
      query: {
        appId: defaultAppId,
        groupId: defaultGroupId,
        meta: [
          {
            op: "eq",
            field: "department",
            value: "engineering",
          },
        ],
      },
    });

    const result = await getMembers({
      args,
      includePermissions: false,
      storage,
    });

    expect(result.members).toHaveLength(1);
    expect(result.members[0].name).toBe("Alice");
    expect(result.members[0].meta?.department).toBe("engineering");
  });

  it("filters by status", async () => {
    // Create test members with different statuses
    const member1Args = makeAddMemberArgs({
      name: "Alice",
      seed: { status: "pending" },
    });
    const member2Args = makeAddMemberArgs({
      name: "Bob",
      seed: { status: "accepted" },
    });

    await addMember({
      args: member1Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member1Args.memberId,
      storage,
    });

    await addMember({
      args: member2Args,
      by: defaultBy,
      byType: defaultByType,
      memberId: member2Args.memberId,
      storage,
    });

    // Debug: Check what members exist before filtering
    const allMembers = await getMembers({
      args: makeGetMembersArgs(),
      includePermissions: false,
      storage,
    });
    console.log(
      "All members before filtering:",
      allMembers.members.map((m) => ({
        name: m.name,
        status: m.status,
        groupId: m.groupId,
      }))
    );

    const args = makeGetMembersArgs({
      query: {
        appId: defaultAppId,
        groupId: defaultGroupId,
        status: { eq: "pending" },
      },
    });

    const result = await getMembers({
      args,
      includePermissions: false,
      storage,
    });

    console.log(
      "Filtered members:",
      result.members.map((m) => ({
        name: m.name,
        status: m.status,
        groupId: m.groupId,
      }))
    );

    expect(result.members).toHaveLength(1);
    expect(result.members[0].name).toBe("Alice");
    expect(result.members[0].status).toBe("pending");
  });
});
