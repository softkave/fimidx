import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { DeleteMonitorsEndpointArgs } from "../../../definitions/monitor.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addMonitor } from "../addMonitor.js";
import { deleteMonitors } from "../deleteMonitors.js";
import { getMonitors } from "../getMonitors.js";

const defaultAppId = "test-app-deleteMonitors";
const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

// Test counter to ensure unique names
let testCounter = 0;

function makeDeleteMonitorsArgs(
  overrides: Partial<DeleteMonitorsEndpointArgs> = {}
): DeleteMonitorsEndpointArgs {
  return {
    query: {
      appId: defaultAppId,
      ...overrides.query,
    },
    deleteMany: overrides.deleteMany,
  };
}

function makeAddMonitorArgs(overrides: any = {}) {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    appId: defaultAppId,
    name: `Test Monitor ${uniqueId}`,
    description: "Test description",
    status: "enabled",
    reportsTo: ["user1", "user2"],
    interval: { days: 1 },
    logsQuery: {
      and: [
        {
          op: "eq",
          field: "level",
          value: "error",
        },
      ],
    },
    ...overrides,
  };
}

describe("deleteMonitors integration", () => {
  let storage: IObjStorage;
  let cleanup: (() => Promise<void>) | undefined;

  beforeAll(async () => {
    // Test will use the default storage type from createDefaultStorage()
    storage = createDefaultStorage();

    // For MongoDB, we need to ensure the connection is ready
    if (
      process.env.FIMIDX_STORAGE_TYPE === "mongo" ||
      !process.env.FIMIDX_STORAGE_TYPE
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
        tag: kObjTags.monitor,
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
        tag: kObjTags.monitor,
        deletedBy: defaultBy,
        deletedByType: defaultByType,
        deleteMany: true,
        hardDelete: true, // Use hard delete for test cleanup
      });
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  it("deletes a single monitor by id", async () => {
    // Create a monitor
    const monitor = await addMonitor({
      args: makeAddMonitorArgs({ name: "Test Monitor" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const args = makeDeleteMonitorsArgs({
      query: {
        appId: defaultAppId,
        id: { eq: monitor.monitor.id },
      },
    });

    await deleteMonitors({
      ...args,
      by: "deleter",
      byType: "user",
      storage,
    });

    // Verify the deletion
    const getArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getMonitors({ args: getArgs, storage });

    expect(result.monitors).toHaveLength(0);
  });

  it("deletes multiple monitors with deleteMany", async () => {
    // Create multiple monitors
    await addMonitor({
      args: makeAddMonitorArgs({ name: "Monitor 1", status: "enabled" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    await addMonitor({
      args: makeAddMonitorArgs({ name: "Monitor 2", status: "enabled" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    await addMonitor({
      args: makeAddMonitorArgs({ name: "Monitor 3", status: "disabled" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const args = makeDeleteMonitorsArgs({
      query: {
        appId: defaultAppId,
        status: { eq: "enabled" },
      },
      deleteMany: true,
    });

    await deleteMonitors({
      ...args,
      by: "deleter",
      byType: "user",
      storage,
    });

    // Verify the deletion
    const getArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getMonitors({ args: getArgs, storage });

    expect(result.monitors).toHaveLength(1);
    expect(result.monitors[0].name).toBe("Monitor 3");
    expect(result.monitors[0].status).toBe("disabled");
  });

  it("deletes monitors by name filter", async () => {
    // Create monitors
    await addMonitor({
      args: makeAddMonitorArgs({ name: "Error Monitor" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    await addMonitor({
      args: makeAddMonitorArgs({ name: "Success Monitor" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const args = makeDeleteMonitorsArgs({
      query: {
        appId: defaultAppId,
        name: { eq: "Error Monitor" },
      },
      deleteMany: true,
    });

    await deleteMonitors({
      ...args,
      by: "deleter",
      byType: "user",
      storage,
    });

    // Verify the deletion
    const getArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getMonitors({ args: getArgs, storage });

    expect(result.monitors).toHaveLength(1);
    expect(result.monitors[0].name).toBe("Success Monitor");
  });

  it("deletes monitors by status filter", async () => {
    // Create monitors
    await addMonitor({
      args: makeAddMonitorArgs({ name: "Enabled Monitor", status: "enabled" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    await addMonitor({
      args: makeAddMonitorArgs({
        name: "Disabled Monitor",
        status: "disabled",
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const args = makeDeleteMonitorsArgs({
      query: {
        appId: defaultAppId,
        status: { eq: "disabled" },
      },
      deleteMany: true,
    });

    await deleteMonitors({
      ...args,
      by: "deleter",
      byType: "user",
      storage,
    });

    // Verify the deletion
    const getArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getMonitors({ args: getArgs, storage });

    expect(result.monitors).toHaveLength(1);
    expect(result.monitors[0].name).toBe("Enabled Monitor");
    expect(result.monitors[0].status).toBe("enabled");
  });

  it("deletes monitors by reportsTo filter", async () => {
    // Create monitors
    await addMonitor({
      args: makeAddMonitorArgs({
        name: "Monitor for User1",
        reportsTo: ["user1"],
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    await addMonitor({
      args: makeAddMonitorArgs({
        name: "Monitor for User2",
        reportsTo: ["user2"],
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const args = makeDeleteMonitorsArgs({
      query: {
        appId: defaultAppId,
        reportsTo: { eq: "user1" },
      },
      deleteMany: true,
    });

    await deleteMonitors({
      ...args,
      by: "deleter",
      byType: "user",
      storage,
    });

    // Verify the deletion
    const getArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getMonitors({ args: getArgs, storage });

    expect(result.monitors).toHaveLength(1);
    expect(result.monitors[0].name).toBe("Monitor for User2");
    expect(result.monitors[0].reportsTo).toEqual([{ userId: "user2" }]);
  });

  it("deletes monitors by createdBy filter", async () => {
    // Create monitors with different creators
    await addMonitor({
      args: makeAddMonitorArgs({ name: "Monitor 1" }),
      by: "user1",
      byType: "user",
      groupId: defaultGroupId,
      storage,
    });

    await addMonitor({
      args: makeAddMonitorArgs({ name: "Monitor 2" }),
      by: "user2",
      byType: "user",
      groupId: defaultGroupId,
      storage,
    });

    const args = makeDeleteMonitorsArgs({
      query: {
        appId: defaultAppId,
        createdBy: { eq: "user1" },
      },
      deleteMany: true,
    });

    await deleteMonitors({
      ...args,
      by: "deleter",
      byType: "user",
      storage,
    });

    // Verify the deletion
    const getArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getMonitors({ args: getArgs, storage });

    expect(result.monitors).toHaveLength(1);
    expect(result.monitors[0].name).toBe("Monitor 2");
    expect(result.monitors[0].createdBy).toBe("user2");
  });

  it("deletes monitors by updatedBy filter", async () => {
    // Create monitors
    const monitor1 = await addMonitor({
      args: makeAddMonitorArgs({ name: "Monitor 1" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const monitor2 = await addMonitor({
      args: makeAddMonitorArgs({ name: "Monitor 2" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Update monitor1 to have a different updatedBy
    const updateArgs = {
      query: {
        appId: defaultAppId,
        id: { eq: monitor1.monitor.id },
      },
      update: {
        description: "Updated description",
      },
    };

    await import("../updateMonitors.js").then(({ updateMonitors }) =>
      updateMonitors({
        args: updateArgs,
        by: "updater1",
        byType: "user",
        storage,
      })
    );

    // Update monitor2 to have a different updatedBy
    const updateArgs2 = {
      query: {
        appId: defaultAppId,
        id: { eq: monitor2.monitor.id },
      },
      update: {
        description: "Updated description 2",
      },
    };

    await import("../updateMonitors.js").then(({ updateMonitors }) =>
      updateMonitors({
        args: updateArgs2,
        by: "updater2",
        byType: "user",
        storage,
      })
    );

    // Delete monitors updated by updater1
    const args = makeDeleteMonitorsArgs({
      query: {
        appId: defaultAppId,
        updatedBy: { eq: "updater1" },
      },
      deleteMany: true,
    });

    await deleteMonitors({
      ...args,
      by: "deleter",
      byType: "user",
      storage,
    });

    // Verify the deletion
    const getArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getMonitors({ args: getArgs, storage });

    console.log("result");
    console.dir(result, { depth: null });

    expect(result.monitors).toHaveLength(1);
    expect(result.monitors[0].name).toBe("Monitor 2");
    expect(result.monitors[0].updatedBy).toBe("updater2");
  });

  it("deletes monitors by createdAt filter", async () => {
    // Create monitors at different times
    const monitor1 = await addMonitor({
      args: makeAddMonitorArgs({ name: "Monitor 1" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Wait a bit to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));

    const monitor2 = await addMonitor({
      args: makeAddMonitorArgs({ name: "Monitor 2" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Delete monitors created after monitor1
    const args = makeDeleteMonitorsArgs({
      query: {
        appId: defaultAppId,
        createdAt: { gt: monitor1.monitor.createdAt.getTime() },
      },
      deleteMany: true,
    });

    await deleteMonitors({
      ...args,
      by: "deleter",
      byType: "user",
      storage,
    });

    // Verify the deletion
    const getArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getMonitors({ args: getArgs, storage });

    expect(result.monitors).toHaveLength(1);
    expect(result.monitors[0].name).toBe("Monitor 1");
  });

  it("deletes monitors by updatedAt filter", async () => {
    // Create monitors
    const monitor1 = await addMonitor({
      args: makeAddMonitorArgs({ name: "Monitor 1" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const monitor2 = await addMonitor({
      args: makeAddMonitorArgs({ name: "Monitor 2" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Update monitor1
    const updateArgs = {
      query: {
        appId: defaultAppId,
        id: { eq: monitor1.monitor.id },
      },
      update: {
        description: "Updated description",
      },
    };

    await import("../updateMonitors.js").then(({ updateMonitors }) =>
      updateMonitors({
        args: updateArgs,
        by: "updater",
        byType: "user",
        storage,
      })
    );

    // Wait a bit to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Update monitor2
    const updateArgs2 = {
      query: {
        appId: defaultAppId,
        id: { eq: monitor2.monitor.id },
      },
      update: {
        description: "Updated description 2",
      },
    };

    await import("../updateMonitors.js").then(({ updateMonitors }) =>
      updateMonitors({
        args: updateArgs2,
        by: "updater",
        byType: "user",
        storage,
      })
    );

    // Get the updated monitor2 to get its updatedAt timestamp
    const getMonitor2Args = {
      query: {
        appId: defaultAppId,
        id: { eq: monitor2.monitor.id },
      },
    };

    const monitor2Result = await getMonitors({
      args: getMonitor2Args,
      storage,
    });
    const updatedMonitor2 = monitor2Result.monitors[0];

    // Delete monitors updated before monitor2's update (should delete monitor1)
    const args = makeDeleteMonitorsArgs({
      query: {
        appId: defaultAppId,
        updatedAt: { lt: updatedMonitor2.updatedAt.getTime() },
      },
      deleteMany: true,
    });

    await deleteMonitors({
      ...args,
      by: "deleter",
      byType: "user",
      storage,
    });

    // Verify the deletion
    const getArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getMonitors({ args: getArgs, storage });

    expect(result.monitors).toHaveLength(1);
    expect(result.monitors[0].name).toBe("Monitor 2");
  });

  it("combines multiple filters for deletion", async () => {
    // Create monitors
    await addMonitor({
      args: makeAddMonitorArgs({
        name: "Enabled Error Monitor",
        status: "enabled",
        reportsTo: ["user1"],
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    await addMonitor({
      args: makeAddMonitorArgs({
        name: "Disabled Error Monitor",
        status: "disabled",
        reportsTo: ["user1"],
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    await addMonitor({
      args: makeAddMonitorArgs({
        name: "Enabled Success Monitor",
        status: "enabled",
        reportsTo: ["user2"],
      }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const args = makeDeleteMonitorsArgs({
      query: {
        appId: defaultAppId,
        status: { eq: "enabled" },
        reportsTo: { eq: "user1" },
      },
      deleteMany: true,
    });

    await deleteMonitors({
      ...args,
      by: "deleter",
      byType: "user",
      storage,
    });

    // Verify the deletion
    const getArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getMonitors({ args: getArgs, storage });

    expect(result.monitors).toHaveLength(2);
    const remainingNames = result.monitors.map((m) => m.name).sort();
    expect(remainingNames).toEqual([
      "Disabled Error Monitor",
      "Enabled Success Monitor",
    ]);
  });

  it("does not delete monitors when no matches found", async () => {
    // Create a monitor
    const monitor = await addMonitor({
      args: makeAddMonitorArgs({ name: "Test Monitor" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const args = makeDeleteMonitorsArgs({
      query: {
        appId: defaultAppId,
        name: { eq: "Non-existent Monitor" },
      },
      deleteMany: true,
    });

    await deleteMonitors({
      ...args,
      by: "deleter",
      byType: "user",
      storage,
    });

    // Verify no changes were made
    const getArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getMonitors({ args: getArgs, storage });

    expect(result.monitors).toHaveLength(1);
    expect(result.monitors[0].name).toBe("Test Monitor");
  });

  it("deletes all monitors when no filters are applied with deleteMany", async () => {
    // Create multiple monitors
    await addMonitor({
      args: makeAddMonitorArgs({ name: "Monitor 1" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    await addMonitor({
      args: makeAddMonitorArgs({ name: "Monitor 2" }),
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const args = makeDeleteMonitorsArgs({
      query: {
        appId: defaultAppId,
      },
      deleteMany: true,
    });

    await deleteMonitors({
      ...args,
      by: "deleter",
      byType: "user",
      storage,
    });

    // Verify all monitors were deleted
    const getArgs = {
      query: {
        appId: defaultAppId,
      },
    };

    const result = await getMonitors({ args: getArgs, storage });

    expect(result.monitors).toHaveLength(0);
  });
});
