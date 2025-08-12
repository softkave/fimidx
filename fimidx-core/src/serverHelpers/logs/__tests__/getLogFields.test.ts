import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { GetLogFieldsEndpointArgs } from "../../../definitions/log.js";
import { indexObjs } from "../../obj/indexObjs.js";
import { getLogFields } from "../getLogFields.js";
import { ingestLogs } from "../ingestLogs.js";
import { createTestSetup } from "./testUtils.js";

const testName = "getLogFields";
const { storage, cleanup, testData } = createTestSetup({ testName });
const { appId, by, byType } = testData;

// Test counter to ensure unique names
let testCounter = 0;

function makeGetLogFieldsArgs(
  overrides: Partial<GetLogFieldsEndpointArgs> = {}
): GetLogFieldsEndpointArgs {
  testCounter++;
  return {
    appId: appId,
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

// Helper to generate a unique appId for each test
function makeUniqueAppId() {
  return `test-app-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

describe("getLogFields integration", () => {
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

  // Helper function to index objects created after a specific timestamp
  async function indexObjectsAfter(timestamp: Date) {
    await indexObjs({
      lastSuccessAt: timestamp,
      storage,
    });
  }

  it("returns empty result when no log fields exist", async () => {
    const args = makeGetLogFieldsArgs({ appId: appId });
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
        appId: appId,
        logs,
      },
      by: by,
      byType: byType,
      groupId: "test-group", // Assuming a default groupId for this test
      storage,
    });
    // Index only the objects created in this test
    await indexObjectsAfter(beforeIngest);
    const args = makeGetLogFieldsArgs({ appId: appId });
    const result = await getLogFields({
      args,
    });
    expect(result.fields.length).toBeGreaterThan(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
    expect(result.hasMore).toBe(false);
    // Check that we have fields for the log properties
    const fieldNames = result.fields.map((f) => f.path);
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
        appId: appId,
        logs,
      },
      by: by,
      byType: byType,
      groupId: "test-group", // Assuming a default groupId for this test
      storage,
    });
    // Index only the objects created in this test
    await indexObjectsAfter(beforeIngest);
    // Test first page with limit 2
    const args1 = makeGetLogFieldsArgs({
      page: 1,
      limit: 2,
      appId: appId,
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
      appId: appId,
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
      groupId: "test-group", // Assuming a default groupId for this test
      storage,
    });
    await ingestLogs({
      args: {
        appId: appId2,
        logs: logs2,
      },
      by: by,
      byType: byType,
      groupId: "test-group", // Assuming a default groupId for this test
      storage,
    });
    // Index only the objects created in this test
    await indexObjectsAfter(beforeIngest);
    // Query for app-1 fields
    const args = makeGetLogFieldsArgs({
      appId: appId1,
    });
    const result = await getLogFields({
      args,
    });
    expect(result.fields.length).toBeGreaterThan(0);
    result.fields.forEach((field) => {
      expect(field.appId).toBe(appId1);
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
        appId: appId,
        logs,
      },
      by: by,
      byType: byType,
      groupId: "test-group", // Assuming a default groupId for this test
      storage,
    });
    // Index only the objects created in this test
    await indexObjectsAfter(beforeIngest);
    const args = makeGetLogFieldsArgs({ appId: appId });
    const result = await getLogFields({
      args,
    });
    expect(result.fields.length).toBeGreaterThan(0);
    // Check for nested field entries
    const fieldNames = result.fields.map((f) => f.path);
    expect(fieldNames).toContain("metadata.user.id");
    expect(fieldNames).toContain("metadata.user.role");
    expect(fieldNames).toContain("metadata.request.method");
    expect(fieldNames).toContain("metadata.request.path");
  });

  it("handles array fields", async () => {
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
        appId: appId,
        logs,
      },
      by: by,
      byType: byType,
      groupId: "test-group", // Assuming a default groupId for this test
      storage,
    });
    // Index only the objects created in this test
    await indexObjectsAfter(beforeIngest);
    const args = makeGetLogFieldsArgs({ appId: appId });
    const result = await getLogFields({
      args,
    });
    expect(result.fields.length).toBeGreaterThan(0);
    // Check for array field entries
    const fieldNames = result.fields.map((f) => f.path);
    expect(fieldNames).toContain("tags.[*]");
    expect(fieldNames).toContain("numbers.[*]");
  });
});
