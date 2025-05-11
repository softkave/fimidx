import { db } from "@/src/db/fmlogs-schema";
import { kAgentTypes } from "@/src/definitions/other";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addLogs } from "./addLogs";

type MockInsertCall = [unknown, { values: unknown[] }];

// Mock the database
vi.mock("@/src/db/fmlogs-schema", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
  logFields: {
    id: "id",
    appId: "appId",
    name: "name",
    nameType: "nameType",
    valueType: "valueType",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    orgId: "orgId",
  },
  logParts: {
    id: "id",
    logId: "logId",
    name: "name",
    value: "value",
    valueBoolean: "valueBoolean",
    valueNumber: "valueNumber",
    type: "type",
    appId: "appId",
    orgId: "orgId",
    createdAt: "createdAt",
  },
  logs: {
    id: "id",
    appId: "appId",
    createdAt: "createdAt",
    createdBy: "createdBy",
    createdByType: "createdByType",
    timestamp: "timestamp",
    updatedAt: "updatedAt",
    orgId: "orgId",
  },
}));

describe("addLogs", () => {
  const mockAppId = "test-app-id";
  const mockOrgId = "test-org-id";
  const mockClientTokenId = "test-client-token-id";
  const mockTimestamp = new Date("2024-03-20T10:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(mockTimestamp);
  });

  it("should process and save logs with various data types", async () => {
    const inputLogs = [
      {
        timestamp: mockTimestamp,
        user: {
          id: 123,
          name: "John Doe",
          isActive: true,
        },
        metadata: {
          version: "1.0.0",
          tags: ["test", "example"],
        },
      },
    ];

    await addLogs({
      appId: mockAppId,
      inputLogs,
      clientTokenId: mockClientTokenId,
      orgId: mockOrgId,
    });

    // Verify database calls
    expect(db.insert).toHaveBeenCalledTimes(3); // For fields, logs, and parts

    // Verify log fields were saved with correct types
    const fieldsInsertCall = (db.insert as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[0] as MockInsertCall;
    expect(fieldsInsertCall[1].values).toContainEqual(
      expect.objectContaining({
        appId: mockAppId,
        orgId: mockOrgId,
        name: "user.id",
        nameType: "user.id",
        valueType: expect.stringContaining("number"),
      })
    );

    // Verify logs were saved
    const logsInsertCall = (db.insert as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[1] as MockInsertCall;
    expect(logsInsertCall[1].values[0]).toMatchObject({
      appId: mockAppId,
      orgId: mockOrgId,
      createdBy: mockClientTokenId,
      createdByType: kAgentTypes.clientToken,
      timestamp: mockTimestamp,
    });

    // Verify log parts were saved
    const partsInsertCall = (db.insert as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[2] as MockInsertCall;
    expect(partsInsertCall[1].values).toContainEqual(
      expect.objectContaining({
        appId: mockAppId,
        orgId: mockOrgId,
        name: "user.name",
        value: "John Doe",
        type: "string",
      })
    );
  });

  it("should handle invalid timestamps by using default date", async () => {
    const inputLogs = [
      {
        timestamp: "invalid-date",
        message: "Test log",
      },
    ];

    await addLogs({
      appId: mockAppId,
      inputLogs,
      clientTokenId: mockClientTokenId,
      orgId: mockOrgId,
    });

    const logsInsertCall = (db.insert as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[1] as MockInsertCall;
    expect(logsInsertCall[1].values[0]).toMatchObject({
      timestamp: mockTimestamp, // Should use default timestamp
    });
  });

  it("should handle null and undefined values", async () => {
    const inputLogs = [
      {
        timestamp: mockTimestamp,
        nullValue: null,
        undefinedValue: undefined,
        numberValue: 42,
      },
    ];

    await addLogs({
      appId: mockAppId,
      inputLogs,
      clientTokenId: mockClientTokenId,
      orgId: mockOrgId,
    });

    const partsInsertCall = (db.insert as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[2] as MockInsertCall;
    expect(partsInsertCall[1].values).toContainEqual(
      expect.objectContaining({
        name: "nullValue",
        value: "null",
        type: "null",
      })
    );
    expect(partsInsertCall[1].values).toContainEqual(
      expect.objectContaining({
        name: "undefinedValue",
        value: "undefined",
        type: "undefined",
      })
    );
  });

  it("should handle nested objects and arrays", async () => {
    const inputLogs = [
      {
        timestamp: mockTimestamp,
        nested: {
          array: [1, 2, 3],
          object: {
            key: "value",
          },
        },
      },
    ];

    await addLogs({
      appId: mockAppId,
      inputLogs,
      clientTokenId: mockClientTokenId,
      orgId: mockOrgId,
    });

    const partsInsertCall = (db.insert as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[2] as MockInsertCall;
    expect(partsInsertCall[1].values).toContainEqual(
      expect.objectContaining({
        name: "nested.array",
        value: expect.any(String),
        type: "object",
      })
    );
    expect(partsInsertCall[1].values).toContainEqual(
      expect.objectContaining({
        name: "nested.object.key",
        value: "value",
        type: "string",
      })
    );
  });
});
