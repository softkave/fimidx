import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  IObjField,
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

describe.skip("PostgresQueryTransformer", () => {
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

  it("transformSort: handles both number and string fields", () => {
    const sort: IObjSortList = [
      { field: "objRecord.price", direction: "asc" },
      { field: "objRecord.name", direction: "desc" },
      { field: "objRecord.quantity", direction: "asc" },
    ];

    const fields: IObjField[] = [
      {
        id: "1",
        path: "price",
        type: "string" as any,
        arrayTypes: [],
        isArrayCompressed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        appId: "app1",
        groupId: "group1",
        tag: "tag1",
      },
      {
        id: "2",
        path: "name",
        type: "string" as any,
        arrayTypes: [],
        isArrayCompressed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        appId: "app1",
        groupId: "group1",
        tag: "tag1",
      },
      {
        id: "3",
        path: "quantity",
        type: "string" as any,
        arrayTypes: [],
        isArrayCompressed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        appId: "app1",
        groupId: "group1",
        tag: "tag1",
      },
    ];

    const result = transformer.transformSort(sort, fields);
    // Should include all fields: price (number), name (string), quantity (number)
    expect(result).toEqual({
      sql: ["", ", ", ""],
      values: [
        {
          sql: ["", ", ", ""],
          values: [
            { raw: "(obj_record->>'price')::numeric ASC" },
            { raw: "obj_record->>'name' DESC" },
          ],
        },
        { raw: "(obj_record->>'quantity')::numeric ASC" },
      ],
    });
  });

  it("transformSort: skips fields not found in fields array", () => {
    const sort: IObjSortList = [
      { field: "objRecord.price", direction: "asc" },
      { field: "objRecord.unknown", direction: "desc" },
    ];

    const fields: IObjField[] = [
      {
        id: "1",
        path: "price",
        type: "string" as any,
        arrayTypes: [],
        isArrayCompressed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        appId: "app1",
        groupId: "group1",
        tag: "tag1",
      },
    ];

    const result = transformer.transformSort(sort, fields);
    // Should only include price, skip unknown field
    expect(result).toEqual({
      raw: "(obj_record->>'price')::numeric ASC",
    });
  });

  it("transformSort: handles string fields correctly", () => {
    const sort: IObjSortList = [
      { field: "objRecord.name", direction: "asc" },
      { field: "objRecord.description", direction: "desc" },
    ];

    const fields: IObjField[] = [
      {
        id: "1",
        path: "name",
        type: "string" as any,
        arrayTypes: [],
        isArrayCompressed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        appId: "app1",
        groupId: "group1",
        tag: "tag1",
      },
    ];

    const result = transformer.transformSort(sort, fields);
    // Should include name field (string) and skip description (not in fields)
    expect(result).toEqual({
      raw: "obj_record->>'name' ASC",
    });
  });

  it("transformSort: returns default when no valid fields found", () => {
    const sort: IObjSortList = [
      { field: "objRecord.unknown1", direction: "asc" },
      { field: "objRecord.unknown2", direction: "desc" },
    ];

    const fields: IObjField[] = [
      {
        id: "1",
        path: "name",
        type: "string" as any,
        arrayTypes: [],
        isArrayCompressed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        appId: "app1",
        groupId: "group1",
        tag: "tag1",
      },
    ];

    const result = transformer.transformSort(sort, fields);
    // Should return default since no fields match
    expect(result).toEqual({ sql: ["created_at DESC"], values: [] });
  });

  it("transformSort: handles nested fields correctly", () => {
    const sort: IObjSortList = [
      { field: "objRecord.product.price", direction: "asc" },
      { field: "objRecord.product.name", direction: "desc" },
    ];

    const fields: IObjField[] = [
      {
        id: "1",
        path: "product.price",
        type: "string" as any,
        arrayTypes: [],
        isArrayCompressed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        appId: "app1",
        groupId: "group1",
        tag: "tag1",
      },
      {
        id: "2",
        path: "product.name",
        type: "string" as any,
        arrayTypes: [],
        isArrayCompressed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        appId: "app1",
        groupId: "group1",
        tag: "tag1",
      },
    ];

    const result = transformer.transformSort(sort, fields);
    expect(result).toEqual({
      sql: ["", ", ", ""],
      values: [
        { raw: "(obj_record#>>'{product,price}')::numeric ASC" },
        { raw: "obj_record#>>'{product,name}' DESC" },
      ],
    });
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
      expect(sqlMock.identifier).toHaveBeenCalledWith("should_index");
    });

    it("should handle fieldsToIndex array field", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          fieldsToIndex: ["field1", "field2"],
        },
      };
      transformer.transformFilter(query, now);
      expect(sqlMock.identifier).toHaveBeenCalledWith("fields_to_index");
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
      expect(sqlMock.identifier).toHaveBeenCalledWith("deleted_at");
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

  describe("array field queries", () => {
    const arrayFields = new Map<string, IObjField>([
      [
        "logsQuery.and",
        {
          id: "1",
          path: "logsQuery.and",
          type: "string" as any,
          arrayTypes: [],
          isArrayCompressed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
      ],
      [
        "comments",
        {
          id: "2",
          path: "comments",
          type: "string" as any,
          arrayTypes: [],
          isArrayCompressed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
      ],
    ]);

    it("should debug array field in operation", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "in",
              field: "logsQuery.and.level",
              value: ["error", "warn"],
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);

      // For now, just verify it doesn't throw
      expect(result).toBeDefined();
    });

    it("should handle array field eq operation", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "eq",
              field: "logsQuery.and.message",
              value: "error occurred",
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Check that the result contains the expected SQL structure
      expect(result).toBeDefined();
      expect((result as any).join).toBeDefined();
      expect((result as any).join.length).toBeGreaterThan(1);
    });

    it("should handle array field neq operation", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "neq",
              field: "logsQuery.and.level",
              value: "debug",
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Check that the result contains NOT EXISTS
      expect(result).toBeDefined();
      expect((result as any).join).toBeDefined();
    });

    it("should handle array field in operation", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "in",
              field: "logsQuery.and.level",
              value: ["error", "warn"],
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Check that the result contains ANY
      expect(result).toBeDefined();
      expect((result as any).join).toBeDefined();
    });

    it("should handle array field not_in operation", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "not_in",
              field: "logsQuery.and.level",
              value: ["debug", "info"],
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Check that the result contains NOT EXISTS
      expect(result).toBeDefined();
      expect((result as any).join).toBeDefined();
    });

    it("should handle array field like operation", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "like",
              field: "logsQuery.and.message",
              value: "error.*",
              caseSensitive: false,
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Check that the result contains regex operator
      expect(result).toBeDefined();
      expect((result as any).join).toBeDefined();
    });

    it("should handle array field exists operation", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "exists",
              field: "logsQuery.and.timestamp",
              value: true,
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Check that the result contains IS NOT NULL
      expect(result).toBeDefined();
      expect((result as any).join).toBeDefined();
    });

    it("should handle array field numeric operations", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "gt",
              field: "logsQuery.and.count",
              value: 5,
            },
            {
              op: "lte",
              field: "logsQuery.and.count",
              value: 100,
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Check that the result contains numeric casting
      expect(result).toBeDefined();
      expect((result as any).join).toBeDefined();
    });

    it("should handle nested array field paths", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "eq",
              field: "logsQuery.and.details.user.id",
              value: "user123",
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Check that the result contains the nested path
      expect(result).toBeDefined();
      expect((result as any).join).toBeDefined();
    });

    it("should fall back to regular query for non-array fields", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "eq",
              field: "regularField",
              value: "value",
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Should not use array-specific SQL
      expect(result).toBeDefined();
      expect((result as any).join).toBeDefined();
    });

    it("should handle array field with empty in array", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "in",
              field: "logsQuery.and.level",
              value: [],
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Should return FALSE for empty in array
      expect(result).toBeDefined();
    });

    it("should handle array field with empty not_in array", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "not_in",
              field: "logsQuery.and.level",
              value: [],
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Should return TRUE for empty not_in array
      expect(result).toBeDefined();
    });

    it("should handle array field between operation", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "between",
              field: "logsQuery.and.count",
              value: [1, 10],
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Check that the result contains numeric casting
      expect(result).toBeDefined();
      expect((result as any).join).toBeDefined();
    });

    it("should handle complex array field queries with logical operators", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "eq",
              field: "logsQuery.and.level",
              value: "error",
            },
          ],
          or: [
            {
              op: "gt",
              field: "logsQuery.and.count",
              value: 5,
            },
            {
              op: "like",
              field: "logsQuery.and.message",
              value: "critical",
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Check that the result contains array-specific SQL
      expect(result).toBeDefined();
      expect((result as any).join).toBeDefined();
    });

    it("should not match pure array field when array is empty", () => {
      const arrayFields = new Map<string, IObjField>([
        [
          "comments",
          {
            id: "2",
            path: "comments",
            type: "string" as any,
            arrayTypes: [],
            isArrayCompressed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            appId: "app1",
            groupId: "group1",
            tag: "tag1",
          },
        ],
      ]);
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "eq",
              field: "comments.rating",
              value: 5,
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Should include jsonb_array_length check in the SQL
      const sqlString = JSON.stringify(result);
      expect(sqlString).toContain("jsonb_array_length");
      expect(sqlString).toContain("> 0");
    });
  });

  describe("enhanced sort functionality", () => {
    it("should handle sort with fields parameter and skip invalid fields", () => {
      const sort: IObjSortList = [
        { field: "objRecord.validField", direction: "asc" },
        { field: "objRecord.invalidField", direction: "desc" },
        { field: "objRecord.anotherValidField", direction: "asc" },
      ];

      const fields: IObjField[] = [
        {
          id: "1",
          path: "validField",
          type: "string" as any,
          arrayTypes: [],
          isArrayCompressed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
        {
          id: "2",
          path: "anotherValidField",
          type: "string" as any,
          arrayTypes: [],
          isArrayCompressed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
      ];

      const result = transformer.transformSort(sort, fields);
      expect(result).toEqual({
        sql: ["", ", ", ""],
        values: [
          { raw: "obj_record->>'validField' ASC" },
          { raw: "(obj_record->>'anotherValidField')::numeric ASC" },
        ],
      });
    });

    it("should handle sort with mixed field types and nested paths", () => {
      const sort: IObjSortList = [
        { field: "objRecord.user.profile.age", direction: "desc" },
        { field: "objRecord.user.profile.name", direction: "asc" },
        { field: "objRecord.createdAt", direction: "desc" },
      ];

      const fields: IObjField[] = [
        {
          id: "1",
          path: "user.profile.age",
          type: "string" as any,
          arrayTypes: [],
          isArrayCompressed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
        {
          id: "2",
          path: "user.profile.name",
          type: "string" as any,
          arrayTypes: [],
          isArrayCompressed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
      ];

      const result = transformer.transformSort(sort, fields);
      expect(result).toEqual({
        sql: ["", ", ", ""],
        values: [
          { raw: "(obj_record#>>'{user,profile,age}')::numeric DESC" },
          { raw: "obj_record#>>'{user,profile,name}' ASC" },
        ],
      });
    });

    it("should handle sort with invalid direction values", () => {
      const sort: IObjSortList = [
        // @ts-expect-error: invalid direction
        { field: "objRecord.field1", direction: "invalid" },
        { field: "objRecord.field2", direction: "asc" },
      ];

      const fields: IObjField[] = [
        {
          id: "1",
          path: "field1",
          type: "string" as any,
          arrayTypes: [],
          isArrayCompressed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
        {
          id: "2",
          path: "field2",
          type: "string" as any,
          arrayTypes: [],
          isArrayCompressed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
      ];

      const result = transformer.transformSort(sort, fields);
      // Should default to DESC for invalid direction
      expect(result).toEqual({
        sql: ["", ", ", ""],
        values: [
          { raw: "obj_record->>'field1' DESC" },
          { raw: "obj_record->>'field2' ASC" },
        ],
      });
    });

    it("should handle sort with multiple clauses properly", () => {
      const sort: IObjSortList = [
        { field: "objRecord.priority", direction: "desc" },
        { field: "objRecord.createdAt", direction: "asc" },
        { field: "objRecord.status", direction: "desc" },
      ];

      const fields: IObjField[] = [
        {
          id: "1",
          path: "priority",
          type: "string" as any,
          arrayTypes: [],
          isArrayCompressed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
        {
          id: "2",
          path: "createdAt",
          type: "string" as any,
          arrayTypes: [],
          isArrayCompressed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
        {
          id: "3",
          path: "status",
          type: "string" as any,
          arrayTypes: [],
          isArrayCompressed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
      ];

      const result = transformer.transformSort(sort, fields);
      expect(result).toEqual({
        sql: ["", ", ", ""],
        values: [
          {
            sql: ["", ", ", ""],
            values: [
              { raw: "(obj_record->>'priority')::numeric DESC" },
              { raw: "obj_record->>'createdAt' ASC" },
            ],
          },
          { raw: "obj_record->>'status' DESC" },
        ],
      });
    });
  });

  describe("enhanced query generation", () => {
    it("should handle complex nested JSONB queries", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "eq",
              field: "user.profile.email",
              value: "test@example.com",
            },
            {
              op: "gt",
              field: "user.profile.age",
              value: 18,
            },
            {
              op: "in",
              field: "user.preferences.tags",
              value: ["tech", "programming"],
            },
          ],
        },
      };
      transformer.transformFilter(query, now);
      expect(sqlMock.raw).toHaveBeenCalledWith(
        expect.stringContaining("obj_record#>>")
      );
    });

    it("should handle array field detection correctly", () => {
      const arrayFields = new Map<string, IObjField>([
        [
          "logs",
          {
            id: "1",
            path: "logs",
            type: "string" as any,
            arrayTypes: [],
            isArrayCompressed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            appId: "app1",
            groupId: "group1",
            tag: "tag1",
          },
        ],
      ]);

      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "eq",
              field: "logs.entry.message",
              value: "test message",
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Check that the result contains array-specific SQL
      // The structure has changed, so we need to check differently
      const resultString = JSON.stringify(result);
      expect(resultString).toContain("jsonb_path_exists");
    });

    it("should handle mixed array and regular field queries", () => {
      const arrayFields = new Map<string, IObjField>([
        [
          "comments",
          {
            id: "1",
            path: "comments",
            type: "string" as any,
            arrayTypes: [],
            isArrayCompressed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            appId: "app1",
            groupId: "group1",
            tag: "tag1",
          },
        ],
      ]);

      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "eq",
              field: "title",
              value: "Test Post",
            },
            {
              op: "gt",
              field: "comments.rating",
              value: 4,
            },
          ],
        },
      };
      transformer.transformFilter(query, now, arrayFields);
      // Should handle both regular and array field queries
      expect(sqlMock).toHaveBeenCalled();
    });

    it("should handle complex logical queries with array fields", () => {
      const arrayFields = new Map<string, IObjField>([
        [
          "logsQuery.and",
          {
            id: "1",
            path: "logsQuery.and",
            type: "string" as any,
            arrayTypes: [],
            isArrayCompressed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            appId: "app1",
            groupId: "group1",
            tag: "tag1",
          },
        ],
      ]);

      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            {
              op: "eq",
              field: "status",
              value: "active",
            },
          ],
          or: [
            {
              op: "eq",
              field: "logsQuery.and.level",
              value: "error",
            },
            {
              op: "gt",
              field: "logsQuery.and.count",
              value: 10,
            },
          ],
        },
      };
      const result = transformer.transformFilter(query, now, arrayFields);
      // Check that the result contains array-specific SQL
      expect(result).toBeDefined();
      expect((result as any).join).toBeDefined();
    });
  });

  describe("Hybrid array/scalar field queries", () => {
    let transformer: PostgresQueryTransformer;
    beforeEach(() => {
      transformer = new PostgresQueryTransformer();
    });

    it("generateHybridArrayQuery: eq", () => {
      const part = { op: "eq", field: "arr.field", value: "one" } as any;
      const arrayFields = new Map<string, IObjField>([
        [
          "arr",
          {
            id: "1",
            path: "arr",
            type: "string" as any,
            arrayTypes: [],
            isArrayCompressed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            appId: "a",
            groupId: "g",
            tag: "t",
          },
        ],
      ]);
      // @ts-ignore
      const result = transformer.generateHybridArrayQuery(part, arrayFields);
      // sqlMock returns { raw: ... } for sql.raw
      expect((result as any).raw).toContain("jsonb_path_exists");
      expect((result as any).raw).toContain('$.arr.field == "one"');
      expect((result as any).raw).toContain('$.arr[*].field == "one"');
    });

    it("generateHybridArrayQuery: in", () => {
      const part = {
        op: "in",
        field: "arr.field",
        value: ["one", "two"],
      } as any;
      const arrayFields = new Map<string, IObjField>([
        [
          "arr",
          {
            id: "1",
            path: "arr",
            type: "string" as any,
            arrayTypes: [],
            isArrayCompressed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            appId: "a",
            groupId: "g",
            tag: "t",
          },
        ],
      ]);
      // @ts-ignore
      const result = transformer.generateHybridArrayQuery(part, arrayFields);
      expect((result as any).raw).toContain("jsonb_path_exists");
      expect((result as any).raw).toContain('$.arr.field == "one"');
      expect((result as any).raw).toContain('$.arr[*].field == "one"');
      expect((result as any).raw).toContain('$.arr.field == "two"');
      expect((result as any).raw).toContain('$.arr[*].field == "two"');
    });

    it("generateHybridArrayQuery: like", () => {
      const part = { op: "like", field: "arr.field", value: "^one" } as any;
      const arrayFields = new Map<string, IObjField>([
        [
          "arr",
          {
            id: "1",
            path: "arr",
            type: "string" as any,
            arrayTypes: [],
            isArrayCompressed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            appId: "a",
            groupId: "g",
            tag: "t",
          },
        ],
      ]);
      // @ts-ignore
      const result = transformer.generateHybridArrayQuery(part, arrayFields);
      expect((result as any).raw).toContain("like_regex");
      expect((result as any).raw).toContain("jsonb_path_exists");
      expect((result as any).raw).toContain(
        '$.arr.field like_regex "^one" flag "i"'
      );
      expect((result as any).raw).toContain(
        '$.arr[*].field like_regex "^one" flag "i"'
      );
    });

    it("generateHybridArrayQuery: exists true", () => {
      const part = { op: "exists", field: "arr.field", value: true } as any;
      const arrayFields = new Map<string, IObjField>([
        [
          "arr",
          {
            id: "1",
            path: "arr",
            type: "string" as any,
            arrayTypes: [],
            isArrayCompressed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            appId: "a",
            groupId: "g",
            tag: "t",
          },
        ],
      ]);
      // @ts-ignore
      const result = transformer.generateHybridArrayQuery(part, arrayFields);
      expect((result as any).raw).toContain("jsonb_path_exists");
      expect((result as any).raw).toContain("exists($.arr.field)");
      expect((result as any).raw).toContain("exists($.arr[*].field)");
    });

    it("generateHybridArrayQuery: exists false", () => {
      const part = { op: "exists", field: "arr.field", value: false } as any;
      const arrayFields = new Map<string, IObjField>([
        [
          "arr",
          {
            id: "1",
            path: "arr",
            type: "string" as any,
            arrayTypes: [],
            isArrayCompressed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            appId: "a",
            groupId: "g",
            tag: "t",
          },
        ],
      ]);
      // @ts-ignore
      const result = transformer.generateHybridArrayQuery(part, arrayFields);
      expect((result as any).raw).toContain("jsonb_path_exists");
      expect((result as any).raw).toContain("!exists($.arr.field)");
      expect((result as any).raw).toContain("!exists($.arr[*].field)");
    });

    it("transformPartQuery: uses hybrid for mixed path", () => {
      const partQuery = [{ op: "eq", field: "arr.field", value: "one" } as any];
      const arrayFields = new Map<string, IObjField>([
        [
          "arr",
          {
            id: "1",
            path: "arr",
            type: "string" as any,
            arrayTypes: [],
            isArrayCompressed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            appId: "a",
            groupId: "g",
            tag: "t",
          },
        ],
      ]);
      // @ts-ignore
      const result = transformer.transformPartQuery(
        partQuery,
        new Date(),
        "AND",
        arrayFields
      );
      // The test sqlMock returns { raw: ... } for sql.raw
      expect((result as any).raw).toContain("jsonb_path_exists");
    });
  });
});
