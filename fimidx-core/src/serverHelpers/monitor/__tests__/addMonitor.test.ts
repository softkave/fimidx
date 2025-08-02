import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { AddMonitorEndpointArgs } from "../../../definitions/monitor.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addMonitor } from "../addMonitor.js";

const defaultAppId = "test-app-addMonitor";
const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

// Test counter to ensure unique names
let testCounter = 0;

function makeAddMonitorArgs(
  overrides: Partial<AddMonitorEndpointArgs> = {}
): AddMonitorEndpointArgs {
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

// Helper function to create monitors with specific names for testing
function makeTestMonitorArgs(name: string, overrides: any = {}) {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    appId: defaultAppId,
    name: `${name}_${uniqueId}`,
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

describe("addMonitor integration", () => {
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

  it("verifies test isolation by checking empty state", async () => {
    // This test verifies that our cleanup is working
    // We can't easily check for empty state in addMonitor tests since we need to create monitors to test
    // But we can verify that each test starts with a clean slate by checking that duplicate names work
    const args = makeAddMonitorArgs({
      name: "Isolation Test Monitor",
    });

    // First monitor creation should succeed
    const result1 = await addMonitor({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result1.monitor).toBeDefined();
    expect(result1.monitor.name).toBe("Isolation Test Monitor");

    // Second monitor with same name should fail due to conflict
    await expect(
      addMonitor({
        args,
        by: defaultBy,
        byType: defaultByType,
        groupId: defaultGroupId,
        storage,
      })
    ).rejects.toThrow("Failed to add monitor");
  });

  it("creates a new monitor successfully", async () => {
    const args = makeAddMonitorArgs({
      name: "My Test Monitor",
      description: "A test monitor description",
      status: "enabled",
      reportsTo: ["user1", "user2", "user3"],
      interval: { hours: 6 },
      logsQuery: {
        and: [
          {
            op: "eq",
            field: "level",
            value: "error",
          },
          {
            op: "gt",
            field: "count",
            value: 10,
          },
        ],
      },
    });

    const result = await addMonitor({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result.monitor).toBeDefined();
    expect(result.monitor.name).toBe("My Test Monitor");
    expect(result.monitor.description).toBe("A test monitor description");
    expect(result.monitor.status).toBe("enabled");
    expect(result.monitor.reportsTo).toEqual([
      { userId: "user1" },
      { userId: "user2" },
      { userId: "user3" },
    ]);
    expect(result.monitor.interval).toEqual({ hours: 6 });
    expect(result.monitor.logsQuery).toEqual({
      and: [
        {
          op: "eq",
          field: "level",
          value: "error",
        },
        {
          op: "gt",
          field: "count",
          value: 10,
        },
      ],
    });
    expect(result.monitor.appId).toBe(defaultAppId);
    expect(result.monitor.groupId).toBe(defaultGroupId);
    expect(result.monitor.createdBy).toBe(defaultBy);
    expect(result.monitor.createdByType).toBe(defaultByType);
    expect(result.monitor.id).toBeDefined();
    expect(result.monitor.createdAt).toBeInstanceOf(Date);
    expect(result.monitor.updatedAt).toBeInstanceOf(Date);
  });

  it("creates a monitor with minimal required fields", async () => {
    const args = makeAddMonitorArgs({
      name: "Minimal Monitor",
      description: undefined,
    });

    const result = await addMonitor({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result.monitor).toBeDefined();
    expect(result.monitor.name).toBe("Minimal Monitor");
    expect(result.monitor.description).toBeUndefined();
  });

  it("fails when trying to create a monitor with duplicate name in same app", async () => {
    const args = makeAddMonitorArgs({
      name: "Duplicate Name Monitor",
    });

    // First monitor creation should succeed
    const result1 = await addMonitor({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result1.monitor).toBeDefined();
    expect(result1.monitor.name).toBe("Duplicate Name Monitor");

    // Second monitor with same name should fail due to conflict
    await expect(
      addMonitor({
        args,
        by: defaultBy,
        byType: defaultByType,
        groupId: defaultGroupId,
        storage,
      })
    ).rejects.toThrow("Failed to add monitor");
  });

  it("allows creating monitors with different names in same app", async () => {
    const args1 = makeAddMonitorArgs({
      name: "First Monitor",
    });

    const args2 = makeAddMonitorArgs({
      name: "Second Monitor",
    });

    const result1 = await addMonitor({
      args: args1,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const result2 = await addMonitor({
      args: args2,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result1.monitor.name).toBe("First Monitor");
    expect(result2.monitor.name).toBe("Second Monitor");
    expect(result1.monitor.id).not.toBe(result2.monitor.id);
  });

  it("allows creating monitors with same name in different apps", async () => {
    const args1 = makeAddMonitorArgs({
      name: "Same Name Monitor",
      appId: "test-app-addMonitor-1",
    });

    const args2 = makeAddMonitorArgs({
      name: "Same Name Monitor",
      appId: "test-app-addMonitor-2",
    });

    const result1 = await addMonitor({
      args: args1,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    const result2 = await addMonitor({
      args: args2,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result1.monitor.name).toBe("Same Name Monitor");
    expect(result2.monitor.name).toBe("Same Name Monitor");
    expect(result1.monitor.appId).toBe("test-app-addMonitor-1");
    expect(result2.monitor.appId).toBe("test-app-addMonitor-2");
    expect(result1.monitor.id).not.toBe(result2.monitor.id);
  });

  it("creates a disabled monitor", async () => {
    const args = makeAddMonitorArgs({
      name: "Disabled Monitor",
      status: "disabled",
    });

    const result = await addMonitor({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result.monitor.status).toBe("disabled");
  });

  it("creates a monitor with empty reportsTo array", async () => {
    const args = makeAddMonitorArgs({
      name: "No Reports Monitor",
      reportsTo: [],
    });

    const result = await addMonitor({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result.monitor.reportsTo).toEqual([]);
  });

  it("creates a monitor with complex logsQuery", async () => {
    const args = makeAddMonitorArgs({
      name: "Complex Query Monitor",
      logsQuery: {
        or: [
          {
            op: "eq",
            field: "level",
            value: "error",
          },
          {
            op: "like",
            field: "message",
            value: "critical",
          },
        ],
      },
    });

    const result = await addMonitor({
      args,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    expect(result.monitor.logsQuery).toEqual({
      or: [
        {
          op: "eq",
          field: "level",
          value: "error",
        },
        {
          op: "like",
          field: "message",
          value: "critical",
        },
      ],
    });
  });
});
