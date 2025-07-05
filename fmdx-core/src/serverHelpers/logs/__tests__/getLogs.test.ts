import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { GetLogsEndpointArgs } from "../../../definitions/log.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { getLogs } from "../getLogs.js";
import { ingestLogs } from "../ingestLogs.js";

const defaultAppId = "test-app-getLogs";
const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

// Test counter to ensure unique names
let testCounter = 0;

function makeGetLogsArgs(
  overrides: Partial<GetLogsEndpointArgs> = {}
): GetLogsEndpointArgs {
  testCounter++;
  return {
    query: {
      appId: defaultAppId,
      logsQuery: undefined,
      metaQuery: undefined,
    },
    page: undefined,
    limit: undefined,
    sort: undefined,
    ...overrides,
  };
}

function makeTestLog(overrides: any = {}) {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    level: "info",
    message: `Test log message ${uniqueId}`,
    timestamp: Date.now(),
    source: "test",
    ...overrides,
  };
}

describe("getLogs integration", () => {
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
        tag: kObjTags.log,
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
        tag: kObjTags.log,
        deletedBy: defaultBy,
        deletedByType: defaultByType,
        deleteMany: true,
        hardDelete: true, // Use hard delete for test cleanup
      });
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  it("returns empty result when no logs exist", async () => {
    const args = makeGetLogsArgs();

    const result = await getLogs({
      args,
      storage,
    });

    expect(result.logs).toEqual([]);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
    expect(result.hasMore).toBe(false);
  });

  it("returns logs with pagination", async () => {
    // Create 3 test logs
    const logs = [
      makeTestLog({ level: "info", message: "Log 1" }),
      makeTestLog({ level: "warn", message: "Log 2" }),
      makeTestLog({ level: "error", message: "Log 3" }),
    ];

    await ingestLogs({
      args: {
        appId: defaultAppId,
        logs,
      },
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Test first page with limit 2
    const args1 = makeGetLogsArgs({
      page: 1,
      limit: 2,
    });

    const result1 = await getLogs({
      args: args1,
      storage,
    });

    expect(result1.logs.length).toBe(2);
    expect(result1.page).toBe(1);
    expect(result1.limit).toBe(2);
    expect(result1.hasMore).toBe(true);

    // Test second page
    const args2 = makeGetLogsArgs({
      page: 2,
      limit: 2,
    });

    const result2 = await getLogs({
      args: args2,
      storage,
    });

    expect(result2.logs.length).toBe(1);
    expect(result2.page).toBe(2);
    expect(result2.limit).toBe(2);
    expect(result2.hasMore).toBe(false);
  });

  it("filters logs by level", async () => {
    // Create logs with different levels
    const logs = [
      makeTestLog({ level: "info", message: "Info log" }),
      makeTestLog({ level: "warn", message: "Warning log" }),
      makeTestLog({ level: "error", message: "Error log" }),
    ];

    await ingestLogs({
      args: {
        appId: defaultAppId,
        logs,
      },
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Filter by error level
    const args = makeGetLogsArgs({
      query: {
        appId: defaultAppId,
        logsQuery: {
          and: [
            {
              op: "eq",
              field: "level",
              value: "error",
            },
          ],
        },
      },
    });

    const result = await getLogs({
      args,
      storage,
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].objRecord.level).toBe("error");
    expect(result.logs[0].objRecord.message).toBe("Error log");
  });

  it("filters logs by multiple criteria", async () => {
    // Create logs with different properties
    const logs = [
      makeTestLog({ level: "info", source: "api", userId: "user1" }),
      makeTestLog({ level: "info", source: "web", userId: "user1" }),
      makeTestLog({ level: "error", source: "api", userId: "user2" }),
    ];

    await ingestLogs({
      args: {
        appId: defaultAppId,
        logs,
      },
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Filter by info level AND api source
    const args = makeGetLogsArgs({
      query: {
        appId: defaultAppId,
        logsQuery: {
          and: [
            {
              op: "eq",
              field: "level",
              value: "info",
            },
            {
              op: "eq",
              field: "source",
              value: "api",
            },
          ],
        },
      },
    });

    const result = await getLogs({
      args,
      storage,
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].objRecord.level).toBe("info");
    expect(result.logs[0].objRecord.source).toBe("api");
    expect(result.logs[0].objRecord.userId).toBe("user1");
  });

  it("filters logs by meta query", async () => {
    // Create logs with different creators
    const logs = [
      makeTestLog({ level: "info", message: "User 1 log" }),
      makeTestLog({ level: "warn", message: "User 1 log" }),
    ];

    await ingestLogs({
      args: {
        appId: defaultAppId,
        logs,
      },
      by: "user1",
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    await ingestLogs({
      args: {
        appId: defaultAppId,
        logs: [makeTestLog({ level: "error", message: "User 2 log" })],
      },
      by: "user2",
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Filter by creator
    const args = makeGetLogsArgs({
      query: {
        appId: defaultAppId,
        metaQuery: {
          createdBy: {
            eq: "user1",
          },
        },
      },
    });

    const result = await getLogs({
      args,
      storage,
    });

    // Should return logs created by user1
    expect(result.logs.length).toBe(2);
    result.logs.forEach((log) => {
      expect(log.createdBy).toBe("user1");
    });
  });

  it("sorts logs by timestamp", async () => {
    // Create logs with different timestamps
    const now = Date.now();
    const logs = [
      makeTestLog({ timestamp: now - 2000, message: "Oldest log" }),
      makeTestLog({ timestamp: now - 1000, message: "Middle log" }),
      makeTestLog({ timestamp: now, message: "Newest log" }),
    ];

    await ingestLogs({
      args: {
        appId: defaultAppId,
        logs,
      },
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Sort by timestamp descending (newest first)
    const args = makeGetLogsArgs({
      sort: [
        {
          field: "timestamp",
          direction: "desc",
        },
      ],
    });

    const result = await getLogs({
      args,
      storage,
    });

    expect(result.logs.length).toBe(3);
    expect(result.logs[0].objRecord.message).toBe("Newest log");
    expect(result.logs[1].objRecord.message).toBe("Middle log");
    expect(result.logs[2].objRecord.message).toBe("Oldest log");
  });

  it("sorts logs by level", async () => {
    // Create logs with different levels
    const logs = [
      makeTestLog({ level: "debug", message: "Debug log" }),
      makeTestLog({ level: "info", message: "Info log" }),
      makeTestLog({ level: "warn", message: "Warning log" }),
      makeTestLog({ level: "error", message: "Error log" }),
    ];

    await ingestLogs({
      args: {
        appId: defaultAppId,
        logs,
      },
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Sort by level ascending
    const args = makeGetLogsArgs({
      sort: [
        {
          field: "level",
          direction: "asc",
        },
      ],
    });

    const result = await getLogs({
      args,
      storage,
    });

    expect(result.logs.length).toBe(4);
    // Should be sorted alphabetically: debug, error, info, warn
    expect(result.logs[0].objRecord.level).toBe("debug");
    expect(result.logs[1].objRecord.level).toBe("error");
    expect(result.logs[2].objRecord.level).toBe("info");
    expect(result.logs[3].objRecord.level).toBe("warn");
  });

  it("handles complex nested field queries", async () => {
    // Create logs with nested metadata
    const logs = [
      makeTestLog({
        level: "info",
        message: "User action",
        metadata: {
          user: { id: "user1", role: "admin" },
          action: "login",
        },
      }),
      makeTestLog({
        level: "info",
        message: "User action",
        metadata: {
          user: { id: "user2", role: "user" },
          action: "logout",
        },
      }),
    ];

    await ingestLogs({
      args: {
        appId: defaultAppId,
        logs,
      },
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Filter by nested field
    const args = makeGetLogsArgs({
      query: {
        appId: defaultAppId,
        logsQuery: {
          and: [
            {
              op: "eq",
              field: "metadata.user.role",
              value: "admin",
            },
          ],
        },
      },
    });

    const result = await getLogs({
      args,
      storage,
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].objRecord.metadata.user.role).toBe("admin");
    expect(result.logs[0].objRecord.metadata.user.id).toBe("user1");
  });

  it("returns only logs for the specified appId", async () => {
    // Create logs for different apps
    const logs1 = [makeTestLog({ level: "info", message: "App 1 log" })];
    const logs2 = [makeTestLog({ level: "info", message: "App 2 log" })];

    await ingestLogs({
      args: {
        appId: "app-1",
        logs: logs1,
      },
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    await ingestLogs({
      args: {
        appId: "app-2",
        logs: logs2,
      },
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storage,
    });

    // Query for app-1 logs
    const args = makeGetLogsArgs({
      query: {
        appId: "app-1",
      },
    });

    const result = await getLogs({
      args,
      storage,
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].objRecord.message).toBe("App 1 log");
    expect(result.logs[0].appId).toBe("app-1");
  });
});
