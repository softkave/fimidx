import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { kMemberStatus } from "../../../definitions/member.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addMember } from "../addMember.js";
import { getMembers } from "../getMembers.js";
import { respondToMemberRequest } from "../respondToMemberRequest.js";

const defaultAppId = "test-app-respondToMemberRequest";
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

function makeRespondToMemberRequestArgs(overrides: any = {}) {
  return {
    appId: defaultAppId,
    groupId: defaultGroupId,
    requestId: "test-request-id",
    status: kMemberStatus.accepted,
    ...overrides,
  };
}

describe("respondToMemberRequest integration", () => {
  let storage: IObjStorage;
  let cleanup: (() => Promise<void>) | undefined;

  beforeAll(async () => {
    storage = createDefaultStorage();

    if (
      process.env.FMDX_STORAGE_TYPE === "mongo" ||
      !process.env.FMDX_STORAGE_TYPE
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
        "test-app-respondToMemberRequest-1",
        "test-app-respondToMemberRequest-2",
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
        "test-app-respondToMemberRequest-1",
        "test-app-respondToMemberRequest-2",
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

  it("accepts a pending member request successfully", async () => {
    // Create a pending member
    const memberArgs = makeAddMemberArgs({
      memberId: "test-member",
      seed: {
        status: kMemberStatus.pending,
      },
    });

    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      memberId: memberArgs.memberId,
      seed: { status: kMemberStatus.pending },
      storage,
    });

    const args = makeRespondToMemberRequestArgs({
      requestId: member.member.id,
      status: kMemberStatus.accepted,
    });

    // Respond to the request
    await respondToMemberRequest({
      args,
      storage,
    });

    // Verify the member status was updated
    const { members } = await getMembers({
      args: {
        query: {
          appId: defaultAppId,
          groupId: defaultGroupId,
          memberId: { eq: member.member.memberId },
        },
      },
      includePermissions: false,
      storage,
    });

    expect(members).toHaveLength(1);
    expect(members[0].status).toBe(kMemberStatus.accepted);
    expect(members[0].statusUpdatedAt).toBeInstanceOf(Date);
  });

  it("rejects a pending member request successfully", async () => {
    // Create a pending member
    const memberArgs = makeAddMemberArgs({
      memberId: "test-member",
      seed: {
        status: kMemberStatus.pending,
      },
    });

    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      memberId: memberArgs.memberId,
      seed: { status: kMemberStatus.pending },
      storage,
    });

    const args = makeRespondToMemberRequestArgs({
      requestId: member.member.id,
      status: kMemberStatus.rejected,
    });

    // Respond to the request
    await respondToMemberRequest({
      args,
      storage,
    });

    // Verify the member status was updated
    const { members } = await getMembers({
      args: {
        query: {
          appId: defaultAppId,
          groupId: defaultGroupId,
          memberId: { eq: member.member.memberId },
        },
      },
      includePermissions: false,
      storage,
    });

    expect(members).toHaveLength(1);
    expect(members[0].status).toBe(kMemberStatus.rejected);
    expect(members[0].statusUpdatedAt).toBeInstanceOf(Date);
  });

  it("throws error when member request not found", async () => {
    const args = makeRespondToMemberRequestArgs({
      requestId: "non-existent-request-id",
    });

    await expect(
      respondToMemberRequest({
        args,
        storage,
      })
    ).rejects.toThrow("Member request not found");
  });

  it("throws error when member status is not pending", async () => {
    // Create an accepted member
    const memberArgs = makeAddMemberArgs({
      memberId: "test-member",
      seed: {
        status: kMemberStatus.accepted,
      },
    });

    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      memberId: memberArgs.memberId,
      seed: { status: kMemberStatus.accepted },
      storage,
    });

    const args = makeRespondToMemberRequestArgs({
      requestId: member.member.id,
      status: kMemberStatus.rejected,
    });

    await expect(
      respondToMemberRequest({
        args,
        storage,
      })
    ).rejects.toThrow("Invalid status");
  });

  it("handles different app IDs", async () => {
    // Create a pending member in a different app
    const memberArgs = makeAddMemberArgs({
      memberId: "test-member",
      appId: "different-app",
      seed: {
        status: kMemberStatus.pending,
      },
    });

    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      memberId: memberArgs.memberId,
      seed: { status: kMemberStatus.pending },
      storage,
    });

    const args = makeRespondToMemberRequestArgs({
      appId: "different-app",
      requestId: member.member.id,
      status: kMemberStatus.accepted,
    });

    await respondToMemberRequest({
      args,
      storage,
    });

    // Verify the member status was updated
    const { members } = await getMembers({
      args: {
        query: {
          appId: "different-app",
          groupId: defaultGroupId,
          memberId: { eq: member.member.memberId },
        },
      },
      includePermissions: false,
      storage,
    });

    expect(members).toHaveLength(1);
    expect(members[0].status).toBe(kMemberStatus.accepted);
  });

  it("handles different group IDs", async () => {
    // Create a pending member in a different group
    const memberArgs = makeAddMemberArgs({
      memberId: "test-member",
      groupId: "different-group",
      seed: {
        status: kMemberStatus.pending,
      },
    });

    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      memberId: memberArgs.memberId,
      seed: { status: kMemberStatus.pending },
      storage,
    });

    const args = makeRespondToMemberRequestArgs({
      groupId: "different-group",
      requestId: member.member.id,
      status: kMemberStatus.accepted,
    });

    await respondToMemberRequest({
      args,
      storage,
    });

    // Verify the member status was updated
    const { members } = await getMembers({
      args: {
        query: {
          appId: defaultAppId,
          groupId: "different-group",
          memberId: { eq: member.member.memberId },
        },
      },
      includePermissions: false,
      storage,
    });

    expect(members).toHaveLength(1);
    expect(members[0].status).toBe(kMemberStatus.accepted);
  });

  it("updates statusUpdatedAt timestamp", async () => {
    // Create a pending member
    const memberArgs = makeAddMemberArgs({
      memberId: "test-member",
      seed: {
        status: kMemberStatus.pending,
      },
    });

    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      memberId: memberArgs.memberId,
      seed: { status: kMemberStatus.pending },
      storage,
    });

    const beforeTime = new Date();

    const args = makeRespondToMemberRequestArgs({
      requestId: member.member.id,
      status: kMemberStatus.accepted,
    });

    await respondToMemberRequest({
      args,
      storage,
    });

    const afterTime = new Date();

    // Verify the member status was updated
    const { members } = await getMembers({
      args: {
        query: {
          appId: defaultAppId,
          groupId: defaultGroupId,
          memberId: { eq: member.member.memberId },
        },
      },
      includePermissions: false,
      storage,
    });

    expect(members).toHaveLength(1);
    expect(members[0].statusUpdatedAt).toBeInstanceOf(Date);

    const statusUpdatedAt = members[0].statusUpdatedAt as Date;
    expect(statusUpdatedAt.getTime()).toBeGreaterThanOrEqual(
      beforeTime.getTime()
    );
    expect(statusUpdatedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  it("handles multiple status updates to the same member", async () => {
    // Create a pending member
    const memberArgs = makeAddMemberArgs({
      memberId: "test-member",
      seed: {
        status: kMemberStatus.pending,
      },
    });

    const member = await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      memberId: memberArgs.memberId,
      seed: { status: kMemberStatus.pending },
      storage,
    });

    // First update: accept
    const args1 = makeRespondToMemberRequestArgs({
      requestId: member.member.id,
      status: kMemberStatus.accepted,
    });

    await respondToMemberRequest({
      args: args1,
      storage,
    });

    // Verify first update
    let { members } = await getMembers({
      args: {
        query: {
          appId: defaultAppId,
          groupId: defaultGroupId,
          memberId: { eq: member.member.memberId },
        },
      },
      includePermissions: false,
      storage,
    });

    expect(members[0].status).toBe(kMemberStatus.accepted);

    // Second update: reject (this should fail since status is no longer pending)
    const args2 = makeRespondToMemberRequestArgs({
      requestId: member.member.id,
      status: kMemberStatus.rejected,
    });

    await expect(
      respondToMemberRequest({
        args: args2,
        storage,
      })
    ).rejects.toThrow("Invalid status");
  });
});
