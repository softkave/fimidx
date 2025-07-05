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
import { getMemberRequests } from "../getMemberRequests.js";

const defaultAppId = "test-app-getMemberRequests";
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

function makeGetMemberRequestsArgs(overrides: any = {}) {
  return {
    query: {
      appId: defaultAppId,
      groupId: defaultGroupId,
      memberId: undefined,
      ...overrides.query,
    },
    page: overrides.page,
    limit: overrides.limit,
  };
}

describe("getMemberRequests integration", () => {
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
        "test-app-getMemberRequests-1",
        "test-app-getMemberRequests-2",
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
        "test-app-getMemberRequests-1",
        "test-app-getMemberRequests-2",
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

  it("gets member requests successfully", async () => {
    // Create test members
    const member1Args = makeAddMemberArgs({ memberId: "member-1" });
    const member2Args = makeAddMemberArgs({ memberId: "member-2" });

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

    const args = makeGetMemberRequestsArgs();

    const result = await getMemberRequests({
      args,
      storage,
    });

    expect(result.requests).toBeDefined();
    expect(result.requests.length).toBeGreaterThanOrEqual(2);
    expect(result.hasMore).toBeDefined();
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);

    // Verify request structure
    const request = result.requests[0];
    expect(request).toHaveProperty("requestId");
    expect(request).toHaveProperty("groupName");
    expect(request).toHaveProperty("status");
    expect(request).toHaveProperty("updatedAt");
  });

  it("filters member requests by memberId", async () => {
    // Create test members
    const member1Args = makeAddMemberArgs({ memberId: "member-1" });
    const member2Args = makeAddMemberArgs({ memberId: "member-2" });

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

    const args = makeGetMemberRequestsArgs({
      query: {
        memberId: "member-1",
      },
    });

    const result = await getMemberRequests({
      args,
      storage,
    });

    expect(result.requests).toBeDefined();
    expect(result.requests).toHaveLength(1);
    expect(result.requests[0].requestId).toBeDefined();
  });

  it("handles pagination correctly", async () => {
    // Create multiple test members
    const members = [];
    for (let i = 0; i < 5; i++) {
      const memberArgs = makeAddMemberArgs({ memberId: `member-${i}` });
      await addMember({
        args: memberArgs,
        by: defaultBy,
        byType: defaultByType,
        memberId: memberArgs.memberId,
        storage,
      });
      members.push(memberArgs);
    }

    // Test first page with limit 2
    const args1 = makeGetMemberRequestsArgs({
      page: 1,
      limit: 2,
    });

    const result1 = await getMemberRequests({
      args: args1,
      storage,
    });

    expect(result1.requests).toHaveLength(2);
    expect(result1.page).toBe(1);
    expect(result1.limit).toBe(2);
    expect(result1.hasMore).toBe(true);

    // Test second page
    const args2 = makeGetMemberRequestsArgs({
      page: 2,
      limit: 2,
    });

    const result2 = await getMemberRequests({
      args: args2,
      storage,
    });

    expect(result2.requests).toHaveLength(2);
    expect(result2.page).toBe(2);
    expect(result2.limit).toBe(2);
    expect(result2.hasMore).toBe(true);

    // Test third page
    const args3 = makeGetMemberRequestsArgs({
      page: 3,
      limit: 2,
    });

    const result3 = await getMemberRequests({
      args: args3,
      storage,
    });

    expect(result3.requests).toHaveLength(1);
    expect(result3.page).toBe(3);
    expect(result3.limit).toBe(2);
    expect(result3.hasMore).toBe(false);
  });

  it("handles empty results", async () => {
    const args = makeGetMemberRequestsArgs({
      query: {
        memberId: "non-existent-member",
      },
    });

    const result = await getMemberRequests({
      args,
      storage,
    });

    expect(result.requests).toBeDefined();
    expect(result.requests).toHaveLength(0);
    expect(result.hasMore).toBe(false);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
  });

  it("filters by different group IDs", async () => {
    // Create members in different groups
    const member1Args = makeAddMemberArgs({
      memberId: "member-1",
      groupId: "group-1",
    });
    const member2Args = makeAddMemberArgs({
      memberId: "member-2",
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

    // Query for group-1
    const args1 = makeGetMemberRequestsArgs({
      query: {
        groupId: "group-1",
      },
    });

    const result1 = await getMemberRequests({
      args: args1,
      storage,
    });

    expect(result1.requests).toHaveLength(1);
    expect(result1.requests[0].requestId).toBeDefined();

    // Query for group-2
    const args2 = makeGetMemberRequestsArgs({
      query: {
        groupId: "group-2",
      },
    });

    const result2 = await getMemberRequests({
      args: args2,
      storage,
    });

    expect(result2.requests).toHaveLength(1);
    expect(result2.requests[0].requestId).toBeDefined();
  });

  it("filters by different app IDs", async () => {
    // Create members in different apps
    const member1Args = makeAddMemberArgs({
      memberId: "member-1",
      appId: "app-1",
    });
    const member2Args = makeAddMemberArgs({
      memberId: "member-2",
      appId: "app-2",
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

    // Query for app-1
    const args1 = makeGetMemberRequestsArgs({
      query: {
        appId: "app-1",
      },
    });

    const result1 = await getMemberRequests({
      args: args1,
      storage,
    });

    expect(result1.requests).toHaveLength(1);
    expect(result1.requests[0].requestId).toBeDefined();

    // Query for app-2
    const args2 = makeGetMemberRequestsArgs({
      query: {
        appId: "app-2",
      },
    });

    const result2 = await getMemberRequests({
      args: args2,
      storage,
    });

    expect(result2.requests).toHaveLength(1);
    expect(result2.requests[0].requestId).toBeDefined();
  });

  it("handles default pagination values", async () => {
    // Create a test member
    const memberArgs = makeAddMemberArgs();
    await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      memberId: memberArgs.memberId,
      storage,
    });

    const args = makeGetMemberRequestsArgs({
      // No page or limit specified
    });

    const result = await getMemberRequests({
      args,
      storage,
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
    expect(result.requests).toBeDefined();
  });

  it("handles custom pagination values", async () => {
    // Create a test member
    const memberArgs = makeAddMemberArgs();
    await addMember({
      args: memberArgs,
      by: defaultBy,
      byType: defaultByType,
      memberId: memberArgs.memberId,
      storage,
    });

    const args = makeGetMemberRequestsArgs({
      page: 5,
      limit: 25,
    });

    const result = await getMemberRequests({
      args,
      storage,
    });

    expect(result.page).toBe(5);
    expect(result.limit).toBe(25);
    expect(result.requests).toBeDefined();
  });
});
