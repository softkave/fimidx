import { db } from "@/src/db/fmlogs-schema";
import { GetLogsEndpointArgs } from "@/src/definitions/log";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { getLogs } from "./getLogs";

// Mock the database
vi.mock("@/src/db/fmlogs-schema", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  },
  logs: {
    id: "id",
    appId: "appId",
    createdAt: "createdAt",
  },
  logParts: {
    id: "id",
    logId: "logId",
    appId: "appId",
    name: "name",
    value: "value",
    valueNumber: "valueNumber",
    createdAt: "createdAt",
  },
}));

describe("getLogs", () => {
  const mockAppId = "test-app-id";
  const mockOrgId = "test-org-id";
  const mockLogs = [
    {
      id: "log1",
      appId: mockAppId,
      createdAt: new Date(),
      message: "Test log 1",
    },
    {
      id: "log2",
      appId: mockAppId,
      createdAt: new Date(),
      message: "Test log 2",
    },
  ];

  const mockLogParts = [
    {
      id: "part1",
      logId: "log1",
      appId: mockAppId,
      name: "status",
      value: "success",
      valueNumber: null,
      createdAt: new Date(),
    },
    {
      id: "part2",
      logId: "log1",
      appId: mockAppId,
      name: "duration",
      value: "100",
      valueNumber: 100,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return logs with pagination when no filters are provided", async () => {
    // Mock database responses
    (db.select as unknown as Mock).mockResolvedValueOnce(mockLogs);
    (db.select as unknown as Mock).mockResolvedValueOnce([{ count: 2 }]);
    (db.select as unknown as Mock).mockResolvedValueOnce(mockLogParts);

    const args: GetLogsEndpointArgs = {
      page: 1,
      limit: 10,
    };

    const result = await getLogs({ args, appId: mockAppId, orgId: mockOrgId });

    expect(result).toEqual({
      logs: [
        {
          ...mockLogs[0],
          parts: [mockLogParts[0], mockLogParts[1]],
        },
        {
          ...mockLogs[1],
          parts: [],
        },
      ],
      page: 1,
      limit: 10,
      total: 2,
    });
  });

  it("should filter logs by logIds", async () => {
    const logIds = ["log1"];
    (db.select as unknown as Mock).mockResolvedValueOnce([mockLogs[0]]);
    (db.select as unknown as Mock).mockResolvedValueOnce([{ count: 1 }]);
    (db.select as unknown as Mock).mockResolvedValueOnce([
      mockLogParts[0],
      mockLogParts[1],
    ]);

    const args: GetLogsEndpointArgs = {
      logIds,
      page: 1,
      limit: 10,
    };

    const result = await getLogs({
      args,
      appId: mockAppId,
      orgId: mockOrgId,
    });

    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].id).toBe("log1");
    expect(result.total).toBe(1);
  });

  it("should filter logs by log parts with eq operator", async () => {
    const args: GetLogsEndpointArgs = {
      filter: [
        {
          op: "eq",
          name: "status",
          value: ["success"],
        },
      ],
      page: 1,
      limit: 10,
    };

    // Mock the log parts query to return log1
    (db.select as unknown as Mock).mockResolvedValueOnce([{ logId: "log1" }]);
    // Mock the logs query
    (db.select as unknown as Mock).mockResolvedValueOnce([mockLogs[0]]);
    // Mock the count query
    (db.select as unknown as Mock).mockResolvedValueOnce([{ count: 1 }]);
    // Mock the log parts query
    (db.select as unknown as Mock).mockResolvedValueOnce([
      mockLogParts[0],
      mockLogParts[1],
    ]);

    const result = await getLogs({
      args,
      appId: mockAppId,
      orgId: mockOrgId,
    });

    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].id).toBe("log1");
    expect(result.total).toBe(1);
  });

  it("should filter logs by log parts with numeric comparison", async () => {
    const args: GetLogsEndpointArgs = {
      filter: [
        {
          op: "gt",
          name: "duration",
          value: ["50"],
        },
      ],
      page: 1,
      limit: 10,
    };

    // Mock the log parts query to return log1
    (db.select as unknown as Mock).mockResolvedValueOnce([{ logId: "log1" }]);
    // Mock the logs query
    (db.select as unknown as Mock).mockResolvedValueOnce([mockLogs[0]]);
    // Mock the count query
    (db.select as unknown as Mock).mockResolvedValueOnce([{ count: 1 }]);
    // Mock the log parts query
    (db.select as unknown as Mock).mockResolvedValueOnce([
      mockLogParts[0],
      mockLogParts[1],
    ]);

    const result = await getLogs({
      args,
      appId: mockAppId,
      orgId: mockOrgId,
    });

    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].id).toBe("log1");
    expect(result.total).toBe(1);
  });

  it("should handle empty filter array", async () => {
    const args: GetLogsEndpointArgs = {
      filter: [],
      page: 1,
      limit: 10,
    };

    // Mock the logs query
    (db.select as unknown as Mock).mockResolvedValueOnce(mockLogs);
    // Mock the count query
    (db.select as unknown as Mock).mockResolvedValueOnce([{ count: 2 }]);
    // Mock the log parts query
    (db.select as unknown as Mock).mockResolvedValueOnce(mockLogParts);

    const result = await getLogs({
      args,
      appId: mockAppId,
      orgId: mockOrgId,
    });

    expect(result.logs).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("should handle pagination correctly", async () => {
    const args: GetLogsEndpointArgs = {
      page: 2,
      limit: 1,
    };

    // Mock the logs query to return only the second log
    (db.select as unknown as Mock).mockResolvedValueOnce([mockLogs[1]]);
    // Mock the count query
    (db.select as unknown as Mock).mockResolvedValueOnce([{ count: 2 }]);
    // Mock the log parts query
    (db.select as unknown as Mock).mockResolvedValueOnce([]);

    const result = await getLogs({
      args,
      appId: mockAppId,
      orgId: mockOrgId,
    });

    expect(result.logs).toHaveLength(1);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(1);
    expect(result.total).toBe(2);
  });
});
