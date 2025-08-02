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
import { updateMemberSendEmailStatus } from "../updateMemberSendEmailStatus.js";

const defaultAppId = "test-app-updateMemberSendEmailStatus";
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

describe("updateMemberSendEmailStatus integration", () => {
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
        "test-app-updateMemberSendEmailStatus-1",
        "test-app-updateMemberSendEmailStatus-2",
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
      }
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  afterEach(async () => {
    try {
      const testAppIds = [
        defaultAppId,
        "test-app-updateMemberSendEmailStatus-1",
        "test-app-updateMemberSendEmailStatus-2",
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
      }
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  it("updates member email status successfully", async () => {
    // Create a member
    const memberArgs = makeAddMemberArgs({ memberId: "test-member" });
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const sentEmailCount = 5;
    const emailLastSentAt = new Date();
    const emailLastSentStatus = "sent" as const;

    await updateMemberSendEmailStatus({
      appId: defaultAppId,
      groupId: defaultGroupId,
      id: member.member.memberId,
      sentEmailCount,
      emailLastSentAt,
      emailLastSentStatus,
      storage,
    });

    // Verify the member email status was updated
    const { members } = await getMembers({
      args: {
        query: {
          appId: defaultAppId,
          groupId: defaultGroupId,
          memberId: { eq: member.member.memberId },
        },
      },
      storage,
    });

    expect(members).toHaveLength(1);
    expect(members[0].sentEmailCount).toBe(sentEmailCount);
    expect(members[0].emailLastSentAt).toEqual(emailLastSentAt);
    expect(members[0].emailLastSentStatus).toBe(emailLastSentStatus);
  });

  it("updates member email status with different email status values", async () => {
    // Create a member
    const memberArgs = makeAddMemberArgs({ memberId: "test-member" });
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const sentEmailCount = 10;
    const emailLastSentAt = new Date();
    const emailLastSentStatus = "failed" as const;

    await updateMemberSendEmailStatus({
      appId: defaultAppId,
      groupId: defaultGroupId,
      id: member.member.memberId,
      sentEmailCount,
      emailLastSentAt,
      emailLastSentStatus,
      storage,
    });

    // Verify the member email status was updated
    const { members } = await getMembers({
      args: {
        query: {
          appId: defaultAppId,
          groupId: defaultGroupId,
          memberId: { eq: member.member.memberId },
        },
      },
      storage,
    });

    expect(members).toHaveLength(1);
    expect(members[0].sentEmailCount).toBe(sentEmailCount);
    expect(members[0].emailLastSentAt).toEqual(emailLastSentAt);
    expect(members[0].emailLastSentStatus).toBe(emailLastSentStatus);
  });

  it("updates member email status with zero email count", async () => {
    // Create a member
    const memberArgs = makeAddMemberArgs({ memberId: "test-member" });
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const sentEmailCount = 0;
    const emailLastSentAt = new Date();
    const emailLastSentStatus = "pending" as const;

    await updateMemberSendEmailStatus({
      appId: defaultAppId,
      groupId: defaultGroupId,
      id: member.member.memberId,
      sentEmailCount,
      emailLastSentAt,
      emailLastSentStatus,
      storage,
    });

    // Verify the member email status was updated
    const { members } = await getMembers({
      args: {
        query: {
          appId: defaultAppId,
          groupId: defaultGroupId,
          memberId: { eq: member.member.memberId },
        },
      },
      storage,
    });

    expect(members).toHaveLength(1);
    expect(members[0].sentEmailCount).toBe(sentEmailCount);
    expect(members[0].emailLastSentAt).toEqual(emailLastSentAt);
    expect(members[0].emailLastSentStatus).toBe(emailLastSentStatus);
  });

  it("handles different app IDs", async () => {
    // Create a member in a different app
    const memberArgs = makeAddMemberArgs({
      memberId: "test-member",
      appId: "different-app",
    });
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const sentEmailCount = 3;
    const emailLastSentAt = new Date();
    const emailLastSentStatus = "sent" as const;

    await updateMemberSendEmailStatus({
      appId: "different-app",
      groupId: defaultGroupId,
      id: member.member.memberId,
      sentEmailCount,
      emailLastSentAt,
      emailLastSentStatus,
      storage,
    });

    // Verify the member email status was updated
    const { members } = await getMembers({
      args: {
        query: {
          appId: "different-app",
          groupId: defaultGroupId,
          memberId: { eq: member.member.memberId },
        },
      },
      storage,
    });

    expect(members).toHaveLength(1);
    expect(members[0].sentEmailCount).toBe(sentEmailCount);
    expect(members[0].emailLastSentAt).toEqual(emailLastSentAt);
    expect(members[0].emailLastSentStatus).toBe(emailLastSentStatus);
  });

  it("handles different group IDs", async () => {
    // Create a member in a different group
    const memberArgs = makeAddMemberArgs({
      memberId: "test-member",
      groupId: "different-group",
    });
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const sentEmailCount = 7;
    const emailLastSentAt = new Date();
    const emailLastSentStatus = "sent" as const;

    await updateMemberSendEmailStatus({
      appId: defaultAppId,
      groupId: "different-group",
      id: member.member.memberId,
      sentEmailCount,
      emailLastSentAt,
      emailLastSentStatus,
      storage,
    });

    // Verify the member email status was updated
    const { members } = await getMembers({
      args: {
        query: {
          appId: defaultAppId,
          groupId: "different-group",
          memberId: { eq: member.member.memberId },
        },
      },
      storage,
    });

    expect(members).toHaveLength(1);
    expect(members[0].sentEmailCount).toBe(sentEmailCount);
    expect(members[0].emailLastSentAt).toEqual(emailLastSentAt);
    expect(members[0].emailLastSentStatus).toBe(emailLastSentStatus);
  });

  it("updates email status for multiple members", async () => {
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

    // Update email status for member 1
    await updateMemberSendEmailStatus({
      appId: defaultAppId,
      groupId: defaultGroupId,
      id: member1.member.memberId,
      sentEmailCount: 5,
      emailLastSentAt: new Date(),
      emailLastSentStatus: "sent" as const,
      storage,
    });

    // Update email status for member 2
    await updateMemberSendEmailStatus({
      appId: defaultAppId,
      groupId: defaultGroupId,
      id: member2.member.memberId,
      sentEmailCount: 10,
      emailLastSentAt: new Date(),
      emailLastSentStatus: "failed" as const,
      storage,
    });

    // Verify both members were updated
    const { members } = await getMembers({
      args: {
        query: {
          appId: defaultAppId,
          groupId: defaultGroupId,
        },
      },
      storage,
    });

    expect(members).toHaveLength(2);

    const member1Updated = members.find(
      (m) => m.memberId === member1.member.memberId
    );
    const member2Updated = members.find(
      (m) => m.memberId === member2.member.memberId
    );

    expect(member1Updated).toBeDefined();
    expect(member1Updated!.sentEmailCount).toBe(5);
    expect(member1Updated!.emailLastSentStatus).toBe("sent");

    expect(member2Updated).toBeDefined();
    expect(member2Updated!.sentEmailCount).toBe(10);
    expect(member2Updated!.emailLastSentStatus).toBe("failed");
  });

  it("preserves other member properties after email status update", async () => {
    // Create a member with specific properties
    const memberArgs = makeAddMemberArgs({
      memberId: "test-member",
      name: "Test Member",
      email: "test@example.com",
      description: "Test description",
      meta: { department: "engineering" },
    });
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const sentEmailCount = 15;
    const emailLastSentAt = new Date();
    const emailLastSentStatus = "sent" as const;

    await updateMemberSendEmailStatus({
      appId: defaultAppId,
      groupId: defaultGroupId,
      id: member.member.memberId,
      sentEmailCount,
      emailLastSentAt,
      emailLastSentStatus,
      storage,
    });

    // Verify the member email status was updated and other properties preserved
    const { members } = await getMembers({
      args: {
        query: {
          appId: defaultAppId,
          groupId: defaultGroupId,
          memberId: { eq: member.member.memberId },
        },
      },
      storage,
    });

    expect(members).toHaveLength(1);
    expect(members[0].name).toBe("Test Member");
    expect(members[0].email).toBe("test@example.com");
    expect(members[0].description).toBe("Test description");
    expect(members[0].meta).toEqual({ department: "engineering" });
    expect(members[0].sentEmailCount).toBe(sentEmailCount);
    expect(members[0].emailLastSentAt).toEqual(emailLastSentAt);
    expect(members[0].emailLastSentStatus).toBe(emailLastSentStatus);
  });

  it("handles large email count values", async () => {
    // Create a member
    const memberArgs = makeAddMemberArgs({ memberId: "test-member" });
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const sentEmailCount = 999999;
    const emailLastSentAt = new Date();
    const emailLastSentStatus = "sent" as const;

    await updateMemberSendEmailStatus({
      appId: defaultAppId,
      groupId: defaultGroupId,
      id: member.member.memberId,
      sentEmailCount,
      emailLastSentAt,
      emailLastSentStatus,
      storage,
    });

    // Verify the member email status was updated
    const { members } = await getMembers({
      args: {
        query: {
          appId: defaultAppId,
          groupId: defaultGroupId,
          memberId: { eq: member.member.memberId },
        },
      },
      storage,
    });

    expect(members).toHaveLength(1);
    expect(members[0].sentEmailCount).toBe(sentEmailCount);
  });

  it("handles custom email status values", async () => {
    // Create a member
    const memberArgs = makeAddMemberArgs({ memberId: "test-member" });
    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    const sentEmailCount = 2;
    const emailLastSentAt = new Date();
    const emailLastSentStatus = "custom_status" as any;

    await updateMemberSendEmailStatus({
      appId: defaultAppId,
      groupId: defaultGroupId,
      id: member.member.memberId,
      sentEmailCount,
      emailLastSentAt,
      emailLastSentStatus,
      storage,
    });

    // Verify the member email status was updated
    const { members } = await getMembers({
      args: {
        query: {
          appId: defaultAppId,
          groupId: defaultGroupId,
          memberId: { eq: member.member.memberId },
        },
      },
      storage,
    });

    expect(members).toHaveLength(1);
    expect(members[0].emailLastSentStatus).toBe("custom_status");
  });
});
