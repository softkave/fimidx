import { describe, expect, it } from "vitest";
import type {
  IObjField,
  IObjQuery,
  IObjSortList,
} from "../../definitions/obj.js";
import { MongoQueryTransformer } from "./MongoQueryTransformer.js";

describe("MongoQueryTransformer", () => {
  const transformer = new MongoQueryTransformer();
  const now = new Date("2024-01-01T00:00:00Z");

  describe("transformFilter", () => {
    it("should add appId to filter", () => {
      const query: IObjQuery = { appId: "app1" };
      expect(transformer.transformFilter(query, now)).toEqual({
        appId: "app1",
      });
    });

    it("should add partQuery to filter (eq)", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: { and: [{ op: "eq", field: "foo", value: "bar" }] },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [{ appId: "app1" }, { "objRecord.foo": { $eq: "bar" } }],
      });
    });

    it("should add metaQuery to filter (string eq)", () => {
      const query: IObjQuery = {
        appId: "app1",
        metaQuery: { id: { eq: "id1" } },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [{ appId: "app1" }, { id: "id1" }],
      });
    });

    it("should combine partQuery and metaQuery", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: { and: [{ op: "eq", field: "foo", value: "bar" }] },
        metaQuery: { id: { eq: "id1" } },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [
          { appId: "app1" },
          { "objRecord.foo": { $eq: "bar" } },
          { id: "id1" },
        ],
      });
    });
  });

  describe("transformSort", () => {
    it("should transform sort list", () => {
      const sort: IObjSortList = [
        { field: "foo", direction: "asc" },
        { field: "bar", direction: "desc" },
      ];
      expect(transformer.transformSort(sort)).toEqual({ foo: 1, bar: -1 });
    });

    it("should filter by fields", () => {
      const sort: IObjSortList = [
        { field: "objRecord.price", direction: "asc" },
        { field: "objRecord.name", direction: "desc" },
        { field: "objRecord.quantity", direction: "asc" },
      ];

      const fields: IObjField[] = [
        {
          id: "1",
          field: "price",
          fieldKeys: ["price"],
          fieldKeyTypes: ["string"],
          valueTypes: ["number"],
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
        {
          id: "2",
          field: "name",
          fieldKeys: ["name"],
          fieldKeyTypes: ["string"],
          valueTypes: ["string"],
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
        {
          id: "3",
          field: "quantity",
          fieldKeys: ["quantity"],
          fieldKeyTypes: ["string"],
          valueTypes: ["number"],
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
      ];

      const result = transformer.transformSort(sort, fields);
      // Should include all fields that are present in the fields array
      expect(result).toEqual({
        "objRecord.price": 1,
        "objRecord.name": -1,
        "objRecord.quantity": 1,
      });
    });

    it("should skip fields not found in fields array", () => {
      const sort: IObjSortList = [
        { field: "objRecord.price", direction: "asc" },
        { field: "objRecord.unknown", direction: "desc" },
      ];

      const fields: IObjField[] = [
        {
          id: "1",
          field: "price",
          fieldKeys: ["price"],
          fieldKeyTypes: ["string"],
          valueTypes: ["number"],
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
        "objRecord.price": 1,
      });
    });

    it("should return empty object when no fields found in fields array", () => {
      const sort: IObjSortList = [
        { field: "objRecord.name", direction: "asc" },
        { field: "objRecord.description", direction: "desc" },
      ];

      const fields: IObjField[] = [
        {
          id: "1",
          field: "price",
          fieldKeys: ["price"],
          fieldKeyTypes: ["string"],
          valueTypes: ["number"],
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
      ];

      const result = transformer.transformSort(sort, fields);
      // Should return default sort since name and description are not in fields array
      expect(result).toEqual({ createdAt: -1 });
    });

    it("should handle nested fields correctly", () => {
      const sort: IObjSortList = [
        { field: "objRecord.product.price", direction: "asc" },
      ];

      const fields: IObjField[] = [
        {
          id: "1",
          field: "product.price",
          fieldKeys: ["product", "price"],
          fieldKeyTypes: ["string", "string"],
          valueTypes: ["number"],
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
      ];

      const result = transformer.transformSort(sort, fields);
      expect(result).toEqual({
        "objRecord.product.price": 1,
      });
    });

    it("should include string fields when present in fields array", () => {
      const sort: IObjSortList = [
        { field: "objRecord.name", direction: "asc" },
        { field: "objRecord.category", direction: "desc" },
      ];

      const fields: IObjField[] = [
        {
          id: "1",
          field: "name",
          fieldKeys: ["name"],
          fieldKeyTypes: ["string"],
          valueTypes: ["string"],
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
        {
          id: "2",
          field: "category",
          fieldKeys: ["category"],
          fieldKeyTypes: ["string"],
          valueTypes: ["string"],
          createdAt: new Date(),
          updatedAt: new Date(),
          appId: "app1",
          groupId: "group1",
          tag: "tag1",
        },
      ];

      const result = transformer.transformSort(sort, fields);
      expect(result).toEqual({
        "objRecord.name": 1,
        "objRecord.category": -1,
      });
    });
  });

  describe("transformPagination", () => {
    it("should calculate skip and limit", () => {
      expect(transformer.transformPagination(2, 10)).toEqual({
        skip: 20,
        limit: 10,
      });
    });
  });

  describe("partQuery operators", () => {
    it("should handle neq", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: { and: [{ op: "neq", field: "foo", value: "bar" }] },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [{ appId: "app1" }, { "objRecord.foo": { $ne: "bar" } }],
      });
    });

    it("should handle gt/gte/lt/lte with numbers", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            { op: "gt", field: "num", value: 5 },
            { op: "gte", field: "num", value: 6 },
            { op: "lt", field: "num", value: 10 },
            { op: "lte", field: "num", value: 11 },
          ],
        },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [
          { appId: "app1" },
          { "objRecord.num": { $gt: 5, $gte: 6, $lt: 10, $lte: 11 } },
        ],
      });
    });

    it("should handle like (case-insensitive)", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: { and: [{ op: "like", field: "foo", value: "bar" }] },
      };
      const filter = transformer.transformFilter(query, now);
      const fooFilter = Array.isArray(filter.$and)
        ? filter.$and.find((f) => f["objRecord.foo"])
        : filter["objRecord.foo"];
      expect(fooFilter["objRecord.foo"].$regex).toBeInstanceOf(RegExp);
      expect(fooFilter["objRecord.foo"].$regex.source).toBe("bar");
      expect(fooFilter["objRecord.foo"].$regex.flags).toContain("i");
    });

    it("should handle like (case-sensitive)", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            { op: "like", field: "foo", value: "bar", caseSensitive: true },
          ],
        },
      };
      const filter = transformer.transformFilter(query, now);
      const fooFilter = Array.isArray(filter.$and)
        ? filter.$and.find((f) => f["objRecord.foo"])
        : filter["objRecord.foo"];
      expect(fooFilter["objRecord.foo"].$regex).toBeInstanceOf(RegExp);
      expect(fooFilter["objRecord.foo"].$regex.flags).not.toContain("i");
    });

    it("should handle in/not_in", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [
            { op: "in", field: "foo", value: ["a", "b"] },
            { op: "not_in", field: "bar", value: [1, 2] },
          ],
        },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [
          { appId: "app1" },
          {
            "objRecord.foo": { $in: ["a", "b"] },
            "objRecord.bar": { $nin: [1, 2] },
          },
        ],
      });
    });

    it("should handle between", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [{ op: "between", field: "num", value: [1, 10] }],
        },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [{ appId: "app1" }, { "objRecord.num": { $gte: 1, $lte: 10 } }],
      });
    });

    it("should handle exists", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          and: [{ op: "exists", field: "foo", value: true }],
        },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [{ appId: "app1" }, { "objRecord.foo": { $exists: true } }],
      });
    });
  });

  describe("metaQuery number ops", () => {
    it("should handle metaQuery number eq/neq/in/not_in", () => {
      const query: IObjQuery = {
        appId: "app1",
        metaQuery: {
          createdAt: {
            eq: 123,
            neq: 456,
            in: [1, 2],
            not_in: [3, 4],
          },
        },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [
          { appId: "app1" },
          {
            createdAt: {
              $eq: 123,
              $ne: 456,
              $in: [1, 2],
              $nin: [3, 4],
            },
          },
        ],
      });
    });
  });

  describe("logicalQuery or", () => {
    it("should handle or queries", () => {
      const query: IObjQuery = {
        appId: "app1",
        partQuery: {
          or: [
            { op: "eq", field: "foo", value: "bar" },
            { op: "eq", field: "baz", value: "qux" },
          ],
        },
      };
      const filter = transformer.transformFilter(query, now);
      if (!filter.$and) throw new Error("Expected $and in filter");
      expect(filter.$and[0].appId).toBe("app1");
      expect(Array.isArray(filter.$and[1].$or)).toBe(true);
      expect(filter.$and[1].$or?.length).toBe(2);
      expect(filter.$and[1].$or).toEqual([
        { "objRecord.foo": { $eq: "bar" } },
        { "objRecord.baz": { $eq: "qux" } },
      ]);
    });
  });

  describe("topLevelFields", () => {
    it("should handle shouldIndex boolean field", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          shouldIndex: true,
        },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [{ appId: "app1" }, { shouldIndex: true }],
      });
    });

    it("should handle fieldsToIndex array field", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          fieldsToIndex: ["field1", "field2"],
        },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [{ appId: "app1" }, { fieldsToIndex: ["field1", "field2"] }],
      });
    });

    it("should handle tag string meta query", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          tag: { eq: "test-tag" },
        },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [{ appId: "app1" }, { tag: "test-tag" }],
      });
    });

    it("should handle groupId string meta query", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          groupId: { in: ["group1", "group2"] },
        },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [{ appId: "app1" }, { groupId: { $in: ["group1", "group2"] } }],
      });
    });

    it("should handle deletedAt null", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          deletedAt: null,
        },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [{ appId: "app1" }, { deletedAt: null }],
      });
    });

    it("should handle deletedAt number meta query", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          deletedAt: { gte: 123 },
        },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [{ appId: "app1" }, { deletedAt: { $gte: new Date(123) } }],
      });
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
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [
          { appId: "app1" },
          { shouldIndex: true, tag: "test-tag", groupId: "group1" },
        ],
      });
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
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [
          { appId: "app1" },
          { "objRecord.foo": { $eq: "bar" } },
          { id: "id1" },
          { shouldIndex: true, tag: "test-tag" },
        ],
      });
    });

    it("should handle queries without tag in topLevelFields", () => {
      const query: IObjQuery = {
        appId: "app1",
        topLevelFields: {
          shouldIndex: true,
          groupId: { eq: "group1" },
        },
      };
      expect(transformer.transformFilter(query, now)).toEqual({
        $and: [{ appId: "app1" }, { shouldIndex: true, groupId: "group1" }],
      });
    });
  });
});
