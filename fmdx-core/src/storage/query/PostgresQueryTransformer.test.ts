import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  IObjMetaQuery,
  IObjPartLogicalQuery,
  IObjPartQueryList,
  IObjQuery,
  IObjSortList,
} from "../../definitions/obj.js";
import { PostgresQueryTransformer } from "./PostgresQueryTransformer.js";

// @ts-ignore
const sqlMock = sql;

vi.mock("drizzle-orm", () => {
  const sqlMock = Object.assign(
    vi.fn((strings: TemplateStringsArray | string[], ...values: any[]) => ({
      sql: strings,
      values,
    })),
    {
      join: vi.fn((arr: any[], sep: any) => ({ join: arr, sep })),
      identifier: vi.fn((field: string) => ({ identifier: field })),
      raw: vi.fn((raw: string) => ({ raw })),
    }
  );
  return { sql: sqlMock };
});

describe("PostgresQueryTransformer", () => {
  let transformer: PostgresQueryTransformer;
  const now = new Date("2024-01-01T00:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
    transformer = new PostgresQueryTransformer();
  });

  it("transformFilter: returns TRUE if no filters", () => {
    const query: IObjQuery = { appId: undefined as any };
    const result = transformer.transformFilter(query, now);
    expect(result).toEqual({ sql: ["TRUE"], values: [] });
  });

  it("transformFilter: adds appId filter", () => {
    const query: IObjQuery = { appId: "app1" };
    transformer.transformFilter(query, now);
    expect(sqlMock).toHaveBeenCalledWith(["app_id = ", ""], "app1");
  });

  it("transformFilter: adds partQuery and metaQuery filters", () => {
    const query: IObjQuery = {
      appId: "app1",
      partQuery: { and: [{ op: "eq", field: "foo", value: "bar" }] },
      metaQuery: { id: { eq: "id1" } },
    };
    transformer.transformFilter(query, now);
    expect(sqlMock).toHaveBeenCalled();
  });

  it("transformSort: returns default sort if empty", () => {
    const result = transformer.transformSort([]);
    expect(result).toEqual({ sql: ["created_at DESC"], values: [] });
  });

  it("transformSort: returns custom sort", () => {
    const sort: IObjSortList = [
      { field: "foo", direction: "asc" },
      { field: "bar", direction: "desc" },
    ];
    transformer.transformSort(sort);
    expect(sqlMock.identifier).toHaveBeenCalledWith("foo");
    expect(sqlMock.identifier).toHaveBeenCalledWith("bar");
  });

  it("transformSort: handles invalid direction", () => {
    // @ts-expect-error: invalid direction
    const sort: IObjSortList = [{ field: "foo", direction: "invalid" }];
    transformer.transformSort(sort);
    expect(sqlMock.identifier).toHaveBeenCalledWith("foo");
  });

  it("transformPagination: returns correct sql", () => {
    const result = transformer.transformPagination(2, 10);
    expect((result as any).sql).toEqual(["OFFSET ", " LIMIT ", ""]);
    expect((result as any).values).toEqual([20, 10]);
  });

  it("transformPagination: handles zero and negative values", () => {
    let result = transformer.transformPagination(0, 0);
    expect((result as any).sql).toEqual(["OFFSET ", " LIMIT ", ""]);
    expect((result as any).values).toEqual([0, 0]);
    result = transformer.transformPagination(-1, -5);
    expect((result as any).sql).toEqual(["OFFSET ", " LIMIT ", ""]);
    expect((result as any).values).toEqual([5, -5]);
  });

  it("transformPartQuery: eq/neq/gt/gte/lt/lte/like/in/not_in/between/exists", () => {
    // @ts-ignore: protected
    const partQuery: IObjPartQueryList = [
      { op: "eq", field: "foo", value: "bar" },
      { op: "neq", field: "foo", value: "baz" },
      { op: "gt", field: "num", value: 5 },
      { op: "gte", field: "num", value: 6 },
      { op: "lt", field: "num", value: 7 },
      { op: "lte", field: "num", value: 8 },
      { op: "like", field: "foo", value: "bar", caseSensitive: false },
      { op: "in", field: "foo", value: ["a", "b"] },
      { op: "not_in", field: "foo", value: ["c", "d"] },
      { op: "between", field: "num", value: [1, 10] },
      { op: "exists", field: "foo", value: true },
      { op: "exists", field: "foo", value: false },
    ];
    // @ts-ignore: protected
    transformer.transformPartQuery(partQuery, now);
    expect(sqlMock).toHaveBeenCalled();
  });

  it("transformPartQuery: returns TRUE if empty", () => {
    // @ts-ignore: protected
    const result = transformer.transformPartQuery([], now);
    expect(result).toEqual({ sql: ["TRUE"], values: [] });
  });

  it("transformLogicalQuery: and/or", () => {
    // @ts-ignore: protected
    const logicalQuery: IObjPartLogicalQuery = {
      and: [{ op: "eq", field: "foo", value: "bar" }],
      or: [{ op: "eq", field: "baz", value: "qux" }],
    };
    // @ts-ignore: protected
    transformer.transformLogicalQuery(logicalQuery, now);
    expect(sqlMock).toHaveBeenCalled();
  });

  it("transformLogicalQuery: returns TRUE if empty", () => {
    // @ts-ignore: protected
    const result = transformer.transformLogicalQuery({}, now);
    expect(result).toEqual({ sql: ["TRUE"], values: [] });
  });

  it("transformMetaQuery: string and number meta queries", () => {
    // @ts-ignore: protected
    const metaQuery: IObjMetaQuery = {
      id: { eq: "id1" },
      createdAt: { gt: 123 },
    };
    // @ts-ignore: protected
    transformer.transformMetaQuery(metaQuery, now);
    expect(sqlMock).toHaveBeenCalled();
  });

  it("transformMetaQuery: returns TRUE if empty", () => {
    // @ts-ignore: protected
    const result = transformer.transformMetaQuery({}, now);
    expect(result).toEqual({ sql: ["TRUE"], values: [] });
  });

  it("private helpers: isStringMetaQuery and isNumberMetaQuery", () => {
    // @ts-ignore: protected
    expect(transformer.isStringMetaQuery({ eq: "foo" })).toBe(true);
    // @ts-ignore: protected
    expect(transformer.isStringMetaQuery({})).toBe(false);
    // @ts-ignore: protected
    expect(transformer.isNumberMetaQuery({ eq: 1 })).toBe(true);
    // @ts-ignore: protected
    expect(transformer.isNumberMetaQuery({})).toBe(false);
  });

  it("private helpers: transformStringMetaQuery and transformNumberMetaQuery", () => {
    // @ts-ignore: protected
    transformer.transformStringMetaQuery("foo", {
      eq: "bar",
      neq: "baz",
      in: ["a"],
      not_in: ["b"],
    });
    // @ts-ignore: protected
    transformer.transformNumberMetaQuery(
      "num",
      {
        eq: 1,
        neq: 2,
        in: [1, 2],
        not_in: [3],
        gt: 4,
        gte: 5,
        lt: 6,
        lte: 7,
        between: [1, 10],
      },
      now
    );
    expect(sqlMock).toHaveBeenCalled();
  });

  describe("topLevelFields", () => {
    it("should handle shouldIndex boolean field", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          shouldIndex: true,
        },
      };
      transformer.transformFilter(query, now);
      expect(sqlMock).toHaveBeenCalledWith(["should_index = ", ""], true);
    });

    it("should handle fieldsToIndex array field", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          fieldsToIndex: ["field1", "field2"],
        },
      };
      transformer.transformFilter(query, now);
      expect(sqlMock).toHaveBeenCalledWith(
        ["fields_to_index = ", ""],
        JSON.stringify(["field1", "field2"])
      );
    });

    it("should handle tag string meta query", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          tag: { eq: "test-tag" },
        },
      };
      transformer.transformFilter(query, now);
      expect(sqlMock.identifier).toHaveBeenCalledWith("tag");
    });

    it("should handle groupId string meta query", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          groupId: { in: ["group1", "group2"] },
        },
      };
      transformer.transformFilter(query, now);
      expect(sqlMock.identifier).toHaveBeenCalledWith("group_id");
    });

    it("should handle deletedAt null", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          deletedAt: null,
        },
      };
      transformer.transformFilter(query, now);
      const calls = (sqlMock as any).mock.calls;
      const found = calls.some(
        (call: any) =>
          Array.isArray(call[0]) && call[0].includes("deleted_at IS NULL")
      );
      expect(found).toBe(true);
    });

    it("should handle deletedAt number meta query", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          deletedAt: { gte: 123 },
        },
      };
      transformer.transformFilter(query, now);
      expect(sqlMock.identifier).toHaveBeenCalledWith("deleted_at");
    });

    it("should combine multiple top-level fields", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          shouldIndex: true,
          tag: { eq: "test-tag" },
          groupId: { eq: "group1" },
        },
      };
      transformer.transformFilter(query, now);
      expect(sqlMock).toHaveBeenCalled();
    });

    it("should combine topLevelFields with other query types", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: { and: [{ op: "eq", field: "foo", value: "bar" }] },
        metaQuery: { id: { eq: "id1" } },
        topLevelFields: {
          shouldIndex: true,
          tag: { eq: "test-tag" },
        },
      };
      transformer.transformFilter(query, now);
      expect(sqlMock).toHaveBeenCalled();
    });

    it("transformTopLevelFields: returns TRUE if empty", () => {
      // @ts-ignore: protected
      const result = transformer.transformTopLevelFields({}, now);
      expect(result).toEqual({ sql: ["TRUE"], values: [] });
    });
  });
});
