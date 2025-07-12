import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import {
  db,
  objArrayFields as objArrayFieldsTable,
} from "../../../db/fmdx.sqlite.js";
import type { IObjArrayField } from "../../../definitions/obj.js";
import { getObjArrayFields } from "../getObjArrayFields.js";

function makeObjArrayField(
  overrides: Partial<IObjArrayField> = {}
): IObjArrayField {
  const now = new Date();
  return {
    id: uuidv7(),
    field: "reportsTo",
    appId: "test-app",
    groupId: "test-group",
    tag: "test-tag",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

async function setupObjArrayFields(fields: IObjArrayField[]) {
  // Clean up existing fields first
  if (fields.length > 0) {
    await db
      .delete(objArrayFieldsTable)
      .where(
        and(
          eq(objArrayFieldsTable.appId, fields[0].appId),
          eq(objArrayFieldsTable.tag, fields[0].tag)
        )
      )
      .execute();
  }

  // Insert new fields
  if (fields.length > 0) {
    await db.insert(objArrayFieldsTable).values(fields);
  }
}

describe("getObjArrayFields", () => {
  beforeEach(async () => {
    // Clean up all test data
    await db
      .delete(objArrayFieldsTable)
      .where(eq(objArrayFieldsTable.appId, "test-app"))
      .execute();
  });

  it("should return array fields for appId and tag", async () => {
    const arrayFields = [
      makeObjArrayField({ field: "reportsTo" }),
      makeObjArrayField({ field: "logsQuery.and" }),
      makeObjArrayField({ field: "scores" }),
    ];

    await setupObjArrayFields(arrayFields);

    const result = await getObjArrayFields({
      appId: "test-app",
      tag: "test-tag",
    });

    expect(result).toHaveLength(3);
    expect(result.map((f) => f.field)).toEqual([
      "reportsTo",
      "logsQuery.and",
      "scores",
    ]);
  });

  it("should filter by appId only", async () => {
    const arrayFields = [
      makeObjArrayField({ field: "reportsTo", tag: "tag1" }),
      makeObjArrayField({ field: "logsQuery.and", tag: "tag2" }),
      makeObjArrayField({ field: "scores", tag: "tag1" }),
    ];

    await setupObjArrayFields(arrayFields);

    const result = await getObjArrayFields({
      appId: "test-app",
    });

    expect(result).toHaveLength(3);
    expect(result.map((f) => f.field)).toEqual([
      "reportsTo",
      "logsQuery.and",
      "scores",
    ]);
  });

  it("should filter by appId and tag", async () => {
    const arrayFields = [
      makeObjArrayField({ field: "reportsTo", tag: "tag1" }),
      makeObjArrayField({ field: "logsQuery.and", tag: "tag2" }),
      makeObjArrayField({ field: "scores", tag: "tag1" }),
    ];

    await setupObjArrayFields(arrayFields);

    const result = await getObjArrayFields({
      appId: "test-app",
      tag: "tag1",
    });

    expect(result).toHaveLength(2);
    expect(result.map((f) => f.field)).toEqual(["reportsTo", "scores"]);
  });

  it("should filter by appId and groupId", async () => {
    const arrayFields = [
      makeObjArrayField({ field: "reportsTo", groupId: "group1" }),
      makeObjArrayField({ field: "logsQuery.and", groupId: "group2" }),
      makeObjArrayField({ field: "scores", groupId: "group1" }),
    ];

    await setupObjArrayFields(arrayFields);

    const result = await getObjArrayFields({
      appId: "test-app",
      groupId: "group1",
    });

    expect(result).toHaveLength(2);
    expect(result.map((f) => f.field)).toEqual(["reportsTo", "scores"]);
  });

  it("should filter by appId, tag, and groupId", async () => {
    const arrayFields = [
      makeObjArrayField({ field: "reportsTo", tag: "tag1", groupId: "group1" }),
      makeObjArrayField({
        field: "logsQuery.and",
        tag: "tag1",
        groupId: "group2",
      }),
      makeObjArrayField({ field: "scores", tag: "tag2", groupId: "group1" }),
    ];

    await setupObjArrayFields(arrayFields);

    const result = await getObjArrayFields({
      appId: "test-app",
      tag: "tag1",
      groupId: "group1",
    });

    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("reportsTo");
  });

  it("should respect pagination with page and limit", async () => {
    const arrayFields = Array.from({ length: 10 }, (_, i) =>
      makeObjArrayField({ field: `field${i}` })
    );

    await setupObjArrayFields(arrayFields);

    const result = await getObjArrayFields({
      appId: "test-app",
      tag: "test-tag",
      page: 1,
      limit: 3,
    });

    expect(result).toHaveLength(3);
    // Should return fields 3, 4, 5 (0-indexed, page 1 = offset 3)
    expect(result.map((f) => f.field)).toEqual(["field3", "field4", "field5"]);
  });

  it("should return empty array when no fields found", async () => {
    const result = await getObjArrayFields({
      appId: "non-existent-app",
      tag: "non-existent-tag",
    });

    expect(result).toHaveLength(0);
  });

  it("should handle default pagination values", async () => {
    const arrayFields = Array.from({ length: 5 }, (_, i) =>
      makeObjArrayField({ field: `field${i}` })
    );

    await setupObjArrayFields(arrayFields);

    const result = await getObjArrayFields({
      appId: "test-app",
      tag: "test-tag",
      // No page or limit specified
    });

    expect(result).toHaveLength(5);
    expect(result.map((f) => f.field)).toEqual([
      "field0",
      "field1",
      "field2",
      "field3",
      "field4",
    ]);
  });

  it("should handle limit larger than available records", async () => {
    const arrayFields = [
      makeObjArrayField({ field: "reportsTo" }),
      makeObjArrayField({ field: "logsQuery.and" }),
    ];

    await setupObjArrayFields(arrayFields);

    const result = await getObjArrayFields({
      appId: "test-app",
      tag: "test-tag",
      limit: 10,
    });

    expect(result).toHaveLength(2);
  });

  it("should handle page beyond available records", async () => {
    const arrayFields = [
      makeObjArrayField({ field: "reportsTo" }),
      makeObjArrayField({ field: "logsQuery.and" }),
    ];

    await setupObjArrayFields(arrayFields);

    const result = await getObjArrayFields({
      appId: "test-app",
      tag: "test-tag",
      page: 5,
      limit: 10,
    });

    expect(result).toHaveLength(0);
  });

  it("should return fields in correct order", async () => {
    const arrayFields = [
      makeObjArrayField({ field: "zebra", createdAt: new Date("2023-01-03") }),
      makeObjArrayField({ field: "alpha", createdAt: new Date("2023-01-01") }),
      makeObjArrayField({ field: "beta", createdAt: new Date("2023-01-02") }),
    ];

    await setupObjArrayFields(arrayFields);

    const result = await getObjArrayFields({
      appId: "test-app",
      tag: "test-tag",
    });

    expect(result).toHaveLength(3);
    // Should be ordered by creation time (oldest first)
    expect(result.map((f) => f.field)).toEqual(["alpha", "beta", "zebra"]);
  });

  it("should handle complex field paths", async () => {
    const arrayFields = [
      makeObjArrayField({ field: "workflow.steps.actions" }),
      makeObjArrayField({ field: "logsQuery.and.op.subOp" }),
      makeObjArrayField({ field: "reportsTo" }),
    ];

    await setupObjArrayFields(arrayFields);

    const result = await getObjArrayFields({
      appId: "test-app",
      tag: "test-tag",
    });

    expect(result).toHaveLength(3);
    expect(result.map((f) => f.field)).toEqual([
      "workflow.steps.actions",
      "logsQuery.and.op.subOp",
      "reportsTo",
    ]);
  });

  it("should handle special characters in field names", async () => {
    const arrayFields = [
      makeObjArrayField({ field: "user.permissions[0].actions" }),
      makeObjArrayField({ field: "config.settings.nested.array" }),
    ];

    await setupObjArrayFields(arrayFields);

    const result = await getObjArrayFields({
      appId: "test-app",
      tag: "test-tag",
    });

    expect(result).toHaveLength(2);
    expect(result.map((f) => f.field)).toEqual([
      "user.permissions[0].actions",
      "config.settings.nested.array",
    ]);
  });

  it("should retrieve array fields with special characters and numeric keys", async () => {
    const fields = [
      makeObjArrayField({ field: "foo.bar[0].baz" }),
      makeObjArrayField({ field: "arr.0.key" }),
    ];
    await setupObjArrayFields(fields);
    const result = await getObjArrayFields({
      appId: "test-app",
      tag: "test-tag",
    });
    expect(result.map((f) => f.field)).toEqual(["foo.bar[0].baz", "arr.0.key"]);
  });
});
