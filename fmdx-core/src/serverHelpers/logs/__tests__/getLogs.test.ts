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
import type { GetLogsEndpointArgs } from "../../../definitions/log.js";
import type { IObjField } from "../../../definitions/obj.js";
import { kObjTags } from "../../../definitions/obj.js";
import { getLogs } from "../getLogs.js";
import { ingestLogs } from "../ingestLogs.js";
import { createTestSetup } from "./testUtils.js";

const testName = "getLogs";
const { storage, cleanup, testData } = createTestSetup({ testName });
const { appId, by, byType } = testData;

// Test counter to ensure unique names
let testCounter = 0;

function makeObjField(overrides: Partial<IObjField> = {}): IObjField {
  const now = new Date();
  return {
    id: uuidv7(),
    createdAt: now,
    updatedAt: now,
    appId: appId,
    groupId: "test-group",
    tag: kObjTags.log,
    path: "timestamp",
    type: "string",
    arrayTypes: [],
    isArrayCompressed: false,
    ...overrides,
  };
}

async function setupObjFields(fields: IObjField[]) {
  // Clean up existing fields first
  if (fields.length > 0) {
    await db
      .delete(objFieldsTable)
      .where(
        and(
          eq(objFieldsTable.appId, fields[0].appId),
          eq(objFieldsTable.tag, fields[0].tag)
        )
      )
      .execute();
  }

  // Insert new fields
  if (fields.length > 0) {
    await db.insert(objFieldsTable).values(fields);
  }
}

function makeGetLogsArgs(
  overrides: Partial<GetLogsEndpointArgs> = {}
): GetLogsEndpointArgs {
  testCounter++;
  return {
    query: {
      appId: appId,
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

// Helper to generate a unique appId for each test
function makeUniqueAppId() {
  return `test-app-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

describe("getLogs integration", () => {
  beforeAll(async () => {
    // Storage is already created by createTestSetup
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("returns empty result when no logs exist", async () => {
    const args = makeGetLogsArgs({ query: { appId: appId } });

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
        appId: appId,
        logs,
      },
      by: by,
      byType: byType,
      groupId: "test-group",
      storage,
    });

    // Test first page with limit 2
    const args1 = makeGetLogsArgs({
      page: 1,
      limit: 2,
      query: { appId: appId },
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
      query: { appId: appId },
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
        appId: appId,
        logs,
      },
      by: by,
      byType: byType,
      groupId: "test-group",
      storage,
    });

    // Filter by error level
    const args = makeGetLogsArgs({
      query: {
        appId: appId,
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
    expect(result.logs[0].data.level).toBe("error");
    expect(result.logs[0].data.message).toBe("Error log");
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
        appId: appId,
        logs,
      },
      by: by,
      byType: byType,
      groupId: "test-group",
      storage,
    });

    // Filter by info level AND api source
    const args = makeGetLogsArgs({
      query: {
        appId: appId,
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
    expect(result.logs[0].data.level).toBe("info");
    expect(result.logs[0].data.source).toBe("api");
    expect(result.logs[0].data.userId).toBe("user1");
  });

  it("filters logs by meta query", async () => {
    // Create logs with different creators
    const logs = [
      makeTestLog({ level: "info", message: "User 1 log" }),
      makeTestLog({ level: "warn", message: "User 1 log" }),
    ];

    await ingestLogs({
      args: {
        appId: appId,
        logs,
      },
      by: "user1",
      byType: byType,
      groupId: "test-group",
      storage,
    });

    await ingestLogs({
      args: {
        appId: appId,
        logs: [makeTestLog({ level: "error", message: "User 2 log" })],
      },
      by: "user2",
      byType: byType,
      groupId: "test-group",
      storage,
    });

    // Filter by creator
    const args = makeGetLogsArgs({
      query: {
        appId: appId,
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
    // Set up obj fields for sorting
    const timestampField = makeObjField({
      path: "timestamp",
      type: "string",
      arrayTypes: [],
      isArrayCompressed: false,
      appId: appId,
    });
    await setupObjFields([timestampField]);

    // Create logs with different timestamps
    const now = Date.now();
    const logs = [
      makeTestLog({ timestamp: now - 2000, message: "Oldest log" }),
      makeTestLog({ timestamp: now - 1000, message: "Middle log" }),
      makeTestLog({ timestamp: now, message: "Newest log" }),
    ];

    await ingestLogs({
      args: {
        appId: appId,
        logs,
      },
      by: by,
      byType: byType,
      groupId: "test-group",
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
      query: { appId: appId },
    });

    const result = await getLogs({
      args,
      storage,
    });

    expect(result.logs.length).toBe(3);
    expect(result.logs[0].data.message).toBe("Newest log");
    expect(result.logs[1].data.message).toBe("Middle log");
    expect(result.logs[2].data.message).toBe("Oldest log");
  });

  it("sorts logs by level", async () => {
    // Set up obj fields for sorting
    const levelField = makeObjField({
      path: "level",
      type: "string",
      arrayTypes: [],
      isArrayCompressed: false,
      appId: appId,
    });
    await setupObjFields([levelField]);

    // Create logs with different levels
    const logs = [
      makeTestLog({ level: "debug", message: "Debug log" }),
      makeTestLog({ level: "info", message: "Info log" }),
      makeTestLog({ level: "warn", message: "Warning log" }),
      makeTestLog({ level: "error", message: "Error log" }),
    ];

    await ingestLogs({
      args: {
        appId: appId,
        logs,
      },
      by: by,
      byType: byType,
      groupId: "test-group",
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
      query: { appId: appId },
    });

    const result = await getLogs({
      args,
      storage,
    });

    expect(result.logs.length).toBe(4);
    // Should be sorted alphabetically: debug, error, info, warn
    expect(result.logs[0].data.level).toBe("debug");
    expect(result.logs[1].data.level).toBe("error");
    expect(result.logs[2].data.level).toBe("info");
    expect(result.logs[3].data.level).toBe("warn");
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
        appId: appId,
        logs,
      },
      by: by,
      byType: byType,
      groupId: "test-group",
      storage,
    });

    // Filter by nested field
    const args = makeGetLogsArgs({
      query: {
        appId: appId,
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
    expect(result.logs[0].data.metadata.user.role).toBe("admin");
    expect(result.logs[0].data.metadata.user.id).toBe("user1");
  });

  it("returns only logs for the specified appId", async () => {
    // Create logs for different apps
    const appId1 = makeUniqueAppId();
    const appId2 = makeUniqueAppId();
    const logs1 = [makeTestLog({ level: "info", message: "App 1 log" })];
    const logs2 = [makeTestLog({ level: "info", message: "App 2 log" })];

    await ingestLogs({
      args: {
        appId: appId1,
        logs: logs1,
      },
      by: by,
      byType: byType,
      groupId: "test-group",
      storage,
    });

    await ingestLogs({
      args: {
        appId: appId2,
        logs: logs2,
      },
      by: by,
      byType: byType,
      groupId: "test-group",
      storage,
    });

    // Query for app-1 logs
    const args = makeGetLogsArgs({
      query: {
        appId: appId1,
      },
    });

    const result = await getLogs({
      args,
      storage,
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].data.message).toBe("App 1 log");
    expect(result.logs[0].appId).toBe(appId1);
  });
});
