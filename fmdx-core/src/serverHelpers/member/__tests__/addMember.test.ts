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
import { getMembers } from "../getMembers.js";

const defaultAppId = "test-app-addMember";
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

describe("addMember integration", () => {
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
        "test-app-addMember-1",
        "test-app-addMember-2",
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
        "test-app-addMember-1",
        "test-app-addMember-2",
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
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  it("creates a member successfully", async () => {
    const args = makeAddMemberArgs();

    const result = await addMember({
      args,
      by: defaultBy,
      byType: defaultByType,
      memberId: args.memberId,
      storage,
    });

    expect(result.member).toBeDefined();
    expect(result.member.name).toBe(args.name);
    expect(result.member.description).toBe(args.description);
    expect(result.member.email).toBe(args.email);
    expect(result.member.memberId).toBe(args.memberId);
    expect(result.member.appId).toBe(args.appId);
    expect(result.member.groupId).toBe(args.groupId);
    expect(result.member.status).toBe("pending");
    expect(result.member.permissions).toBeNull(); // No permissions by default
  });

  it("creates a member with permissions", async () => {
    const args = makeAddMemberArgs({
      permissions: [
        {
          entity: "test",
          action: "read",
          target: "data",
        },
        {
          entity: "user",
          action: "write",
          target: "profile",
        },
      ],
    });

    const result = await addMember({
      args,
      by: defaultBy,
      byType: defaultByType,
      memberId: args.memberId,
      storage,
    });

    expect(result.member).toBeDefined();
    expect(result.member.permissions).not.toBeNull();
    expect(result.member.permissions).toHaveLength(2);
    expect(result.member.permissions![0]).toEqual({
      entity: "test",
      action: "read",
      target: "data",
    });
    expect(result.member.permissions![1]).toEqual({
      entity: "user",
      action: "write",
      target: "profile",
    });
  });

  it("creates a member with meta data", async () => {
    const args = makeAddMemberArgs({
      meta: {
        department: "engineering",
        level: "senior",
        location: "remote",
      },
    });

    const result = await addMember({
      args,
      by: defaultBy,
      byType: defaultByType,
      memberId: args.memberId,
      storage,
    });

    expect(result.member).toBeDefined();
    expect(result.member.meta).toEqual({
      department: "engineering",
      level: "senior",
      location: "remote",
    });
  });

  it("creates a member with custom seed data", async () => {
    const args = makeAddMemberArgs();
    const seed = {
      status: "accepted" as const,
      statusUpdatedAt: new Date("2023-01-01"),
      sentEmailCount: 5,
      emailLastSentAt: new Date("2023-01-01"),
      emailLastSentStatus: "delivered" as const,
    };

    const result = await addMember({
      args,
      by: defaultBy,
      byType: defaultByType,
      memberId: args.memberId,
      seed,
      storage,
    });

    expect(result.member).toBeDefined();
    expect(result.member.status).toBe("accepted");
    expect(result.member.statusUpdatedAt).toEqual(new Date("2023-01-01"));
    expect(result.member.sentEmailCount).toBe(5);
    expect(result.member.emailLastSentAt).toEqual(new Date("2023-01-01"));
    expect(result.member.emailLastSentStatus).toBe("delivered");
  });

  it("fails when memberId already exists", async () => {
    const args1 = makeAddMemberArgs({ memberId: "duplicate-id" });
    const args2 = makeAddMemberArgs({
      memberId: "duplicate-id",
      name: "Different Name",
      email: "different@example.com",
    });

    // First member should be created successfully
    await addMember({
      args: args1,
      by: defaultBy,
      byType: defaultByType,
      memberId: args1.memberId,
      storage,
    });

    // Second member with same memberId should fail
    await expect(
      addMember({
        args: args2,
        by: defaultBy,
        byType: defaultByType,
        memberId: args2.memberId,
        storage,
      })
    ).rejects.toThrow("Failed to add member");
  });

  it("fails when email already exists", async () => {
    const args1 = makeAddMemberArgs({ email: "duplicate@example.com" });
    const args2 = makeAddMemberArgs({
      email: "duplicate@example.com",
      name: "Different Name",
      memberId: "different-id",
    });

    // First member should be created successfully
    await addMember({
      args: args1,
      by: defaultBy,
      byType: defaultByType,
      memberId: args1.memberId,
      storage,
    });

    // Second member with same email should fail
    await expect(
      addMember({
        args: args2,
        by: defaultBy,
        byType: defaultByType,
        memberId: args2.memberId,
        storage,
      })
    ).rejects.toThrow("Failed to add member");
  });

  it("creates member that can be retrieved by getMembers", async () => {
    const args = makeAddMemberArgs({
      name: "Test Member for Retrieval",
      permissions: [
        {
          entity: "test",
          action: "read",
          target: "data",
        },
      ],
    });

    // Create the member
    const addResult = await addMember({
      args,
      by: defaultBy,
      byType: defaultByType,
      memberId: args.memberId,
      storage,
    });

    // Retrieve the member
    const getResult = await getMembers({
      args: {
        query: {
          appId: defaultAppId,
          groupId: defaultGroupId,
          memberId: { eq: args.memberId },
        },
      },
      includePermissions: true,
      storage,
    });

    expect(getResult.members).toHaveLength(1);
    expect(getResult.members[0].id).toBe(addResult.member.id);
    expect(getResult.members[0].name).toBe("Test Member for Retrieval");
    expect(getResult.members[0].permissions).not.toBeNull();
    expect(getResult.members[0].permissions).toHaveLength(1);
  });

  it("sets default values when seed is not provided", async () => {
    const args = makeAddMemberArgs();

    const result = await addMember({
      args,
      by: defaultBy,
      byType: defaultByType,
      memberId: args.memberId,
      storage,
    });

    expect(result.member.status).toBe("pending");
    expect(result.member.sentEmailCount).toBe(0);
    expect(result.member.emailLastSentAt).toBeNull();
    expect(result.member.emailLastSentStatus).toBeNull();
    expect(result.member.statusUpdatedAt).toBeInstanceOf(Date);
  });

  it("creates member with different app and group", async () => {
    const args = makeAddMemberArgs({
      appId: "different-app",
      groupId: "different-group",
    });

    const result = await addMember({
      args,
      by: defaultBy,
      byType: defaultByType,
      memberId: args.memberId,
      storage,
    });

    expect(result.member.appId).toBe("different-app");
    expect(result.member.groupId).toBe("different-group");
  });

  it("creates member without email", async () => {
    const args = makeAddMemberArgs({
      email: undefined,
    });

    const result = await addMember({
      args,
      by: defaultBy,
      byType: defaultByType,
      memberId: args.memberId,
      storage,
    });

    expect(result.member.email).toBeNull();
  });

  it("creates member without description", async () => {
    const args = makeAddMemberArgs({
      description: undefined,
    });

    const result = await addMember({
      args,
      by: defaultBy,
      byType: defaultByType,
      memberId: args.memberId,
      storage,
    });

    expect(result.member.description).toBeNull();
  });
});
