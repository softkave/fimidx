import { and, eq } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  db,
  objFields as objFieldsTable,
  objParts as objPartsTable,
} from "../../../db/fmdx.sqlite.js";
import type { GetLogFieldValuesEndpointArgs } from "../../../definitions/log.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { indexObjs } from "../../obj/indexObjs.js";
import { getLogFieldValues } from "../getLogFieldValues.js";
import { ingestLogs } from "../ingestLogs.js";

const defaultAppId = "test-app-getLogFieldValues";
const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

// Test counter to ensure unique names
let testCounter = 0;

function makeGetLogFieldValuesArgs(
  overrides: Partial<GetLogFieldValuesEndpointArgs> = {}
): GetLogFieldValuesEndpointArgs {
  testCounter++;
  return {
    appId: defaultAppId,
    field: "level",
    page: undefined,
    limit: undefined,
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

describe("getLogFieldValues integration", () => {
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

    // Clean up indexed data (objFields and objParts)
    try {
      await db
        .delete(objFieldsTable)
        .where(
          and(
            eq(objFieldsTable.appId, defaultAppId),
            eq(objFieldsTable.tag, kObjTags.log)
          )
        )
        .execute();

      await db
        .delete(objPartsTable)
        .where(
          and(
            eq(objPartsTable.appId, defaultAppId),
            eq(objPartsTable.tag, kObjTags.log)
          )
        )
        .execute();
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

    // Clean up indexed data (objFields and objParts)
    try {
      await db
        .delete(objFieldsTable)
        .where(
          and(
            eq(objFieldsTable.appId, defaultAppId),
            eq(objFieldsTable.tag, kObjTags.log)
          )
        )
        .execute();

      await db
        .delete(objPartsTable)
        .where(
          and(
            eq(objPartsTable.appId, defaultAppId),
            eq(objPartsTable.tag, kObjTags.log)
          )
        )
        .execute();
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  // Helper function to index objects created after a specific timestamp
  async function indexObjectsAfter(timestamp: Date) {
    await indexObjs({
      lastSuccessAt: timestamp,
      storage,
    });
  }

  it("returns empty result when no field values exist", async () => {
    const args = makeGetLogFieldValuesArgs();

    const result = await getLogFieldValues({
      args,
    });

    expect(result.values).toEqual([]);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
    expect(result.hasMore).toBe(false);
  });

  it("returns field values after ingesting logs", async () => {
    const beforeIngest = new Date();

    // Create logs with different level values
    const logs = [
      makeTestLog({ level: "info", message: "Info log" }),
      makeTestLog({ level: "warn", message: "Warning log" }),
      makeTestLog({ level: "error", message: "Error log" }),
      makeTestLog({ level: "debug", message: "Debug log" }),
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

    // Index only the objects created in this test
    await indexObjectsAfter(beforeIngest);

    const args = makeGetLogFieldValuesArgs({
      field: "level",
    });

    const result = await getLogFieldValues({
      args,
    });

    expect(result.values.length).toBeGreaterThan(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
    expect(result.hasMore).toBe(false);

    // Check that we have values for the level field
    const levelValues = result.values.map((v) => v.value);
    expect(levelValues).toContain("info");
    expect(levelValues).toContain("warn");
    expect(levelValues).toContain("error");
    expect(levelValues).toContain("debug");
  });

  it("supports pagination", async () => {
    const beforeIngest = new Date();

    // Create many logs with different level values
    const logs = [];
    const levels = ["info", "warn", "error", "debug", "fatal"];
    for (let i = 0; i < 10; i++) {
      logs.push(
        makeTestLog({
          level: levels[i % levels.length],
          message: `Log ${i}`,
        })
      );
    }

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

    // Index only the objects created in this test
    await indexObjectsAfter(beforeIngest);

    // Test first page with limit 2
    const args1 = makeGetLogFieldValuesArgs({
      field: "level",
      page: 1,
      limit: 2,
    });

    const result1 = await getLogFieldValues({
      args: args1,
    });

    expect(result1.values.length).toBe(2);
    expect(result1.page).toBe(1);
    expect(result1.limit).toBe(2);
    expect(result1.hasMore).toBe(true);

    // Test second page
    const args2 = makeGetLogFieldValuesArgs({
      field: "level",
      page: 2,
      limit: 2,
    });

    const result2 = await getLogFieldValues({
      args: args2,
    });

    expect(result2.values.length).toBeGreaterThan(0);
    expect(result2.page).toBe(2);
    expect(result2.limit).toBe(2);
    // hasMore depends on total number of unique values
  });

  it("returns only values for the specified field", async () => {
    const beforeIngest = new Date();

    // Create logs with different fields
    const logs = [
      makeTestLog({ level: "info", source: "api", userId: "user1" }),
      makeTestLog({ level: "error", source: "web", userId: "user2" }),
      makeTestLog({ level: "warn", source: "mobile", userId: "user3" }),
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

    // Index only the objects created in this test
    await indexObjectsAfter(beforeIngest);

    // Query for level field values
    const levelArgs = makeGetLogFieldValuesArgs({
      field: "level",
    });

    const levelResult = await getLogFieldValues({
      args: levelArgs,
    });

    expect(levelResult.values.length).toBeGreaterThan(0);
    levelResult.values.forEach((value) => {
      expect(value.type).toBe("string");
      expect(["info", "error", "warn"]).toContain(value.value);
    });

    // Query for source field values
    const sourceArgs = makeGetLogFieldValuesArgs({
      field: "source",
    });

    const sourceResult = await getLogFieldValues({
      args: sourceArgs,
    });

    expect(sourceResult.values.length).toBeGreaterThan(0);
    sourceResult.values.forEach((value) => {
      expect(value.type).toBe("string");
      expect(["api", "web", "mobile"]).toContain(value.value);
    });
  });

  it("returns only values for the specified appId", async () => {
    const beforeIngest = new Date();

    // Create logs for different apps
    const logs1 = [
      makeTestLog({ level: "info", message: "App 1 log" }),
      makeTestLog({ level: "error", message: "App 1 log" }),
    ];
    const logs2 = [
      makeTestLog({ level: "warn", message: "App 2 log" }),
      makeTestLog({ level: "debug", message: "App 2 log" }),
    ];

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

    // Index only the objects created in this test
    await indexObjectsAfter(beforeIngest);

    // Query for app-1 level values
    const args = makeGetLogFieldValuesArgs({
      appId: "app-1",
      field: "level",
    });

    const result = await getLogFieldValues({
      args,
    });

    expect(result.values.length).toBeGreaterThan(0);
    const levelValues = result.values.map((v) => v.value);
    expect(levelValues).toContain("info");
    expect(levelValues).toContain("error");
    expect(levelValues).not.toContain("warn");
    expect(levelValues).not.toContain("debug");
  });

  it("handles nested field values", async () => {
    const beforeIngest = new Date();

    // Create logs with nested objects
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

    // Index only the objects created in this test
    await indexObjectsAfter(beforeIngest);

    // Query for nested field values
    const args = makeGetLogFieldValuesArgs({
      field: "metadata.user.role",
    });

    const result = await getLogFieldValues({
      args,
    });

    expect(result.values.length).toBeGreaterThan(0);
    const roleValues = result.values.map((v) => v.value);
    expect(roleValues).toContain("admin");
    expect(roleValues).toContain("user");
  });

  it("handles different value types", async () => {
    const beforeIngest = new Date();

    // Create logs with different value types
    const logs = [
      makeTestLog({
        level: "info",
        message: "Test log",
        count: 42,
        isActive: true,
        tags: ["tag1", "tag2"],
      }),
      makeTestLog({
        level: "error",
        message: "Error log",
        count: 100,
        isActive: false,
        tags: ["tag3"],
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

    // Index only the objects created in this test
    await indexObjectsAfter(beforeIngest);

    // Query for string field
    const stringArgs = makeGetLogFieldValuesArgs({
      field: "level",
    });

    const stringResult = await getLogFieldValues({
      args: stringArgs,
    });

    expect(stringResult.values.length).toBeGreaterThan(0);
    stringResult.values.forEach((value) => {
      expect(value.type).toBe("string");
    });

    // Query for number field
    const numberArgs = makeGetLogFieldValuesArgs({
      field: "count",
    });

    const numberResult = await getLogFieldValues({
      args: numberArgs,
    });

    expect(numberResult.values.length).toBeGreaterThan(0);
    numberResult.values.forEach((value) => {
      expect(value.type).toBe("number");
      expect([42, 100]).toContain(parseInt(value.value));
    });

    // Query for boolean field
    const booleanArgs = makeGetLogFieldValuesArgs({
      field: "isActive",
    });

    const booleanResult = await getLogFieldValues({
      args: booleanArgs,
    });

    expect(booleanResult.values.length).toBeGreaterThan(0);
    booleanResult.values.forEach((value) => {
      expect(value.type).toBe("boolean");
      expect(["true", "false"]).toContain(value.value);
    });
  });
});
