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
import type { GetLogFieldsEndpointArgs } from "../../../definitions/log.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { indexObjs } from "../../obj/indexObjs.js";
import { getLogFields } from "../getLogFields.js";
import { ingestLogs } from "../ingestLogs.js";

const defaultAppId = "test-app-getLogFields";
const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

// Test counter to ensure unique names
let testCounter = 0;

function makeGetLogFieldsArgs(
  overrides: Partial<GetLogFieldsEndpointArgs> = {}
): GetLogFieldsEndpointArgs {
  testCounter++;
  return {
    appId: defaultAppId,
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

describe("getLogFields integration", () => {
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

  it("returns empty result when no log fields exist", async () => {
    const args = makeGetLogFieldsArgs();

    const result = await getLogFields({
      args,
    });

    expect(result.fields).toEqual([]);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
    expect(result.hasMore).toBe(false);
  });

  it("returns log fields after ingesting logs", async () => {
    const beforeIngest = new Date();

    // Create logs with different fields
    const logs = [
      makeTestLog({ level: "info", message: "Test log", userId: "user1" }),
      makeTestLog({ level: "error", message: "Error log", errorCode: "E001" }),
      makeTestLog({ level: "warn", message: "Warning log", source: "api" }),
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

    const args = makeGetLogFieldsArgs();

    const result = await getLogFields({
      args,
    });

    expect(result.fields.length).toBeGreaterThan(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
    expect(result.hasMore).toBe(false);

    // Check that we have fields for the log properties
    const fieldNames = result.fields.map((f) => f.field);
    expect(fieldNames).toContain("level");
    expect(fieldNames).toContain("message");
    expect(fieldNames).toContain("timestamp");
    expect(fieldNames).toContain("source");
  });

  it("supports pagination", async () => {
    const beforeIngest = new Date();

    // Create many logs with different fields to generate multiple field entries
    const logs = [];
    for (let i = 0; i < 5; i++) {
      logs.push(
        makeTestLog({
          level: "info",
          message: `Log ${i}`,
          [`field${i}`]: `value${i}`,
          [`nested${i}`]: { [`key${i}`]: `value${i}` },
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
    const args1 = makeGetLogFieldsArgs({
      page: 1,
      limit: 2,
    });

    const result1 = await getLogFields({
      args: args1,
    });

    expect(result1.fields.length).toBe(2);
    expect(result1.page).toBe(1);
    expect(result1.limit).toBe(2);
    expect(result1.hasMore).toBe(true);

    // Test second page
    const args2 = makeGetLogFieldsArgs({
      page: 2,
      limit: 2,
    });

    const result2 = await getLogFields({
      args: args2,
    });

    expect(result2.fields.length).toBeGreaterThan(0);
    expect(result2.page).toBe(2);
    expect(result2.limit).toBe(2);
    // hasMore depends on total number of fields
  });

  it("returns only fields for the specified appId", async () => {
    const beforeIngest = new Date();

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

    // Index only the objects created in this test
    await indexObjectsAfter(beforeIngest);

    // Query for app-1 fields
    const args = makeGetLogFieldsArgs({
      appId: "app-1",
    });

    const result = await getLogFields({
      args,
    });

    expect(result.fields.length).toBeGreaterThan(0);
    result.fields.forEach((field) => {
      expect(field.appId).toBe("app-1");
      expect(field.tag).toBe(kObjTags.log);
    });
  });

  it("handles nested object fields", async () => {
    const beforeIngest = new Date();

    // Create logs with nested objects
    const logs = [
      makeTestLog({
        level: "info",
        message: "Complex log",
        metadata: {
          user: { id: "user1", role: "admin" },
          request: { method: "POST", path: "/api" },
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

    const args = makeGetLogFieldsArgs();

    const result = await getLogFields({
      args,
    });

    expect(result.fields.length).toBeGreaterThan(0);

    // Check for nested field entries
    const fieldNames = result.fields.map((f) => f.field);
    expect(fieldNames).toContain("metadata.user.id");
    expect(fieldNames).toContain("metadata.user.role");
    expect(fieldNames).toContain("metadata.request.method");
    expect(fieldNames).toContain("metadata.request.path");
  });

  it.only("handles array fields", async () => {
    const beforeIngest = new Date();

    // Create logs with array fields
    const logs = [
      makeTestLog({
        level: "info",
        message: "Array log",
        tags: ["tag1", "tag2", "tag3"],
        numbers: [1, 2, 3, 4, 5],
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

    const args = makeGetLogFieldsArgs();

    const result = await getLogFields({
      args,
    });

    expect(result.fields.length).toBeGreaterThan(0);

    // Check for array field entries
    const fieldNames = result.fields.map((f) => f.field);
    expect(fieldNames).toContain("tags");
    expect(fieldNames).toContain("numbers");
  });
});
