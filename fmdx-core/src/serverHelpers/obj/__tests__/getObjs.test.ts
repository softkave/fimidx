import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getObjModel } from "../../../db/fmdx.mongo.js";
import {
  db,
  objArrayFields as objArrayFieldsTable,
  objFields as objFieldsTable,
} from "../../../db/fmdx.sqlite.js";
import type {
  IInputObjRecord,
  IObj,
  IObjArrayField,
  IObjField,
  IObjSortList,
} from "../../../definitions/obj.js";
import { createStorage } from "../../../storage/config.js";
import { getManyObjs, metaQueryToPartQueryList } from "../getObjs.js";

const backends: { type: "mongo" | "postgres"; name: string }[] = [
  { type: "mongo", name: "MongoDB" },
  { type: "postgres", name: "Postgres" },
];

function makeInputObjRecord(
  overrides: Partial<IInputObjRecord> = {}
): IInputObjRecord {
  return {
    name: "Test Object",
    value: Math.random(),
    ...overrides,
  };
}

function makeObjFields(overrides: Partial<IObj> = {}): IObj {
  const now = new Date();
  return {
    id: uuidv7(),
    createdAt: now,
    updatedAt: now,
    createdBy: "tester",
    createdByType: "user",
    updatedBy: "tester",
    updatedByType: "user",
    appId: "test-app",
    groupId: "test-group",
    tag: "test-tag",
    objRecord: makeInputObjRecord(),
    deletedAt: null,
    deletedBy: null,
    deletedByType: null,
    shouldIndex: true,
    fieldsToIndex: null,
    ...overrides,
  };
}

function makeObjField(overrides: Partial<IObjField> = {}): IObjField {
  const now = new Date();
  return {
    id: uuidv7(),
    createdAt: now,
    updatedAt: now,
    appId: "test-app",
    groupId: "test-group",
    field: "objRecord.order",
    fieldKeys: ["order"],
    fieldKeyTypes: ["string"],
    valueTypes: ["number"],
    tag: "test-tag",
    ...overrides,
  };
}

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

describe("metaQueryToPartQueryList", () => {
  it("converts string meta queries", () => {
    const metaQuery = {
      foo: { eq: "bar", neq: "baz", in: ["a", "b"], not_in: ["c"] },
    };
    const result = metaQueryToPartQueryList({ metaQuery });
    expect(result).toEqual([
      { op: "eq", field: "foo", value: "bar" },
      { op: "neq", field: "foo", value: "baz" },
      { op: "in", field: "foo", value: ["a", "b"] },
      { op: "not_in", field: "foo", value: ["c"] },
    ]);
  });

  it("converts number meta queries", () => {
    const metaQuery = {
      num: {
        eq: 1,
        gt: 0,
        gte: 1,
        lt: 10,
        lte: 9,
        between: [1, 5] as [number, number],
      },
    };
    const result = metaQueryToPartQueryList({ metaQuery });
    expect(result).toEqual([
      { op: "eq", field: "num", value: 1 },
      { op: "gt", field: "num", value: 0 },
      { op: "gte", field: "num", value: 1 },
      { op: "lt", field: "num", value: 10 },
      { op: "lte", field: "num", value: 9 },
      { op: "between", field: "num", value: [1, 5] },
    ]);
  });

  it("applies prefix if provided", () => {
    const metaQuery = { foo: { eq: "bar" } };
    const result = metaQueryToPartQueryList({ metaQuery, prefix: "p" });
    expect(result).toEqual([{ op: "eq", field: "p.foo", value: "bar" }]);
  });

  it("returns undefined for empty metaQuery", () => {
    expect(metaQueryToPartQueryList({ metaQuery: {} })).toBeUndefined();
  });
});

describe.each(backends)("getManyObjs integration (%s)", (backend) => {
  let storage: ReturnType<typeof createStorage>;
  let cleanup: (() => Promise<void>) | undefined;

  beforeAll(async () => {
    storage = createStorage({ type: backend.type });
    if (backend.type === "mongo") {
      const model = getObjModel();
      if (model && model.db && model.db.asPromise) await model.db.asPromise();
      cleanup = async () => {
        await model.db.close();
      };
    }
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  beforeEach(async () => {
    if (backend.type === "mongo") {
      const model = getObjModel();
      await model.deleteMany({ appId: "test-app", tag: "test-tag" });
    } else if (backend.type === "postgres") {
      const { fmdxPostgresDb, objs } = await import(
        "../../../db/fmdx.postgres.js"
      );
      await fmdxPostgresDb
        .delete(objs)
        .where(and(eq(objs.appId, "test-app"), eq(objs.tag, "test-tag")));
    }

    // Clean up obj fields for all backends
    await db
      .delete(objFieldsTable)
      .where(
        and(
          eq(objFieldsTable.appId, "test-app"),
          eq(objFieldsTable.tag, "test-tag")
        )
      )
      .execute();
  });

  it("returns objects by appId and tag", async () => {
    const obj = makeObjFields();
    await storage.create({ objs: [obj] });
    const result = await getManyObjs({
      objQuery: { appId: obj.appId },
      tag: obj.tag,
      storageType: backend.type,
    });
    expect(result.objs.length).toBeGreaterThanOrEqual(1);
    expect(result.objs.some((o: IObj) => o.id === obj.id)).toBe(true);
  });

  it("supports partQuery (eq)", async () => {
    const obj = makeObjFields({ objRecord: { foo: "bar" } });

    // Set up obj fields for querying
    const objField = makeObjField({
      field: "foo",
      fieldKeys: ["foo"],
      fieldKeyTypes: ["string"],
      valueTypes: ["string"],
    });
    await setupObjFields([objField]);

    await storage.create({ objs: [obj] });
    const result = await getManyObjs({
      objQuery: {
        appId: obj.appId,
        partQuery: { and: [{ op: "eq", field: "foo", value: "bar" }] },
      },
      tag: obj.tag,
      storageType: backend.type,
    });
    expect(result.objs.length).toBe(1);
    expect(result.objs[0].objRecord.foo).toBe("bar");
  });

  it("supports metaQuery (createdBy eq)", async () => {
    const obj = makeObjFields({ createdBy: "meta-tester" });
    await storage.create({ objs: [obj] });
    const result = await getManyObjs({
      objQuery: {
        appId: obj.appId,
        metaQuery: { createdBy: { eq: "meta-tester" } },
      },
      tag: obj.tag,
      storageType: backend.type,
    });
    expect(result.objs.length).toBe(1);
    expect(result.objs[0].createdBy).toBe("meta-tester");
  });

  it("supports pagination and sorting", async () => {
    const objs = [
      makeObjFields({ objRecord: { order: 1 } }),
      makeObjFields({ objRecord: { order: 2 } }),
      makeObjFields({ objRecord: { order: 3 } }),
    ];

    // Set up obj fields for sorting
    const objField = makeObjField({
      field: "order",
      fieldKeys: ["order"],
      fieldKeyTypes: ["string"],
      valueTypes: ["number"],
    });
    await setupObjFields([objField]);

    await storage.create({ objs });

    const sort: IObjSortList = [
      {
        field: "objRecord.order",
        direction: "desc",
      },
    ];
    const result = await getManyObjs({
      objQuery: { appId: objs[0].appId },
      tag: objs[0].tag,
      page: 0,
      limit: 2,
      sort,
      storageType: backend.type,
    });

    expect(result.objs.length).toBe(2);
    expect(result.objs[0].objRecord.order).toBeGreaterThanOrEqual(
      result.objs[1].objRecord.order
    );
    // Page 2
    const result2 = await getManyObjs({
      objQuery: { appId: objs[0].appId },
      tag: objs[0].tag,
      page: 1,
      limit: 2,
      sort,
      storageType: backend.type,
    });
    // Should get the remaining object(s)
    expect(result2.objs.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty if no match", async () => {
    const result = await getManyObjs({
      objQuery: { appId: "nonexistent-app" },
      tag: "nonexistent-tag",
      storageType: backend.type,
    });
    expect(result.objs.length).toBe(0);
  });

  it("should handle array field queries with reportsTo.userId", async () => {
    const obj = makeObjFields({
      objRecord: {
        reportsTo: [
          { userId: "user1", role: "admin" },
          { userId: "user2", role: "user" },
        ],
      },
    });

    await storage.create({ objs: [obj] });

    // Set up array field metadata
    const arrayField = makeObjArrayField({
      field: "reportsTo",
      appId: obj.appId,
      tag: obj.tag,
    });

    await setupObjArrayFields([arrayField]);

    const result = await getManyObjs({
      objQuery: {
        appId: obj.appId,
        partQuery: {
          and: [{ op: "eq", field: "reportsTo.userId", value: "user1" }],
        },
      },
      tag: obj.tag,
      storageType: backend.type,
    });

    expect(result.objs).toHaveLength(1);
    expect(result.objs[0].id).toBe(obj.id);
  });

  it("should handle array field queries with logsQuery.and.op", async () => {
    const obj = makeObjFields({
      objRecord: {
        logsQuery: {
          and: [
            { op: "eq", field: "status", value: "active" },
            { op: "in", field: "type", value: ["error", "warning"] },
          ],
        },
      },
    });

    await storage.create({ objs: [obj] });

    // Set up array field metadata
    const arrayField = makeObjArrayField({
      field: "logsQuery.and",
      appId: obj.appId,
      tag: obj.tag,
    });

    await setupObjArrayFields([arrayField]);

    const result = await getManyObjs({
      objQuery: {
        appId: obj.appId,
        partQuery: {
          and: [{ op: "eq", field: "logsQuery.and.op", value: "eq" }],
        },
      },
      tag: obj.tag,
      storageType: backend.type,
    });

    expect(result.objs).toHaveLength(1);
    expect(result.objs[0].id).toBe(obj.id);
  });

  it("should handle deeply nested array field queries", async () => {
    const obj = makeObjFields({
      objRecord: {
        logsQuery: {
          and: [
            {
              op: [
                { subOp: "eq", value: "test" },
                { subOp: "neq", value: "other" },
              ],
            },
          ],
        },
      },
    });

    await storage.create({ objs: [obj] });

    // Set up array field metadata for both levels
    const arrayFields = [
      makeObjArrayField({
        field: "logsQuery.and",
        appId: obj.appId,
        tag: obj.tag,
      }),
      makeObjArrayField({
        field: "logsQuery.and.op",
        appId: obj.appId,
        tag: obj.tag,
      }),
    ];

    await setupObjArrayFields(arrayFields);

    const result = await getManyObjs({
      objQuery: {
        appId: obj.appId,
        partQuery: {
          and: [{ op: "eq", field: "logsQuery.and.op.subOp", value: "eq" }],
        },
      },
      tag: obj.tag,
      storageType: backend.type,
    });

    expect(result.objs).toHaveLength(1);
    expect(result.objs[0].id).toBe(obj.id);
  });

  it("should handle array field queries with 'in' operation", async () => {
    const obj = makeObjFields({
      objRecord: {
        reportsTo: [
          { userId: "user1", role: "admin" },
          { userId: "user2", role: "user" },
          { userId: "user3", role: "moderator" },
        ],
      },
    });

    await storage.create({ objs: [obj] });

    const arrayField = makeObjArrayField({
      field: "reportsTo",
      appId: obj.appId,
      tag: obj.tag,
    });

    await setupObjArrayFields([arrayField]);

    const result = await getManyObjs({
      objQuery: {
        appId: obj.appId,
        partQuery: {
          and: [
            { op: "in", field: "reportsTo.userId", value: ["user1", "user3"] },
          ],
        },
      },
      tag: obj.tag,
      storageType: backend.type,
    });

    expect(result.objs).toHaveLength(1);
    expect(result.objs[0].id).toBe(obj.id);
  });

  it("should handle array field queries with numeric comparisons", async () => {
    const obj = makeObjFields({
      objRecord: {
        scores: [
          { value: 85, category: "math" },
          { value: 92, category: "science" },
          { value: 78, category: "history" },
        ],
      },
    });

    await storage.create({ objs: [obj] });

    const arrayField = makeObjArrayField({
      field: "scores",
      appId: obj.appId,
      tag: obj.tag,
    });

    await setupObjArrayFields([arrayField]);

    const result = await getManyObjs({
      objQuery: {
        appId: obj.appId,
        partQuery: { and: [{ op: "gte", field: "scores.value", value: 90 }] },
      },
      tag: obj.tag,
      storageType: backend.type,
    });

    expect(result.objs).toHaveLength(1);
    expect(result.objs[0].id).toBe(obj.id);
  });

  it("should handle mixed array and regular field queries", async () => {
    const obj = makeObjFields({
      objRecord: {
        name: "Test Object",
        reportsTo: [
          { userId: "user1", role: "admin" },
          { userId: "user2", role: "user" },
        ],
      },
    });

    await storage.create({ objs: [obj] });

    // Set up both regular fields and array fields
    const objField = makeObjField({
      field: "name",
      appId: obj.appId,
      tag: obj.tag,
    });

    const arrayField = makeObjArrayField({
      field: "reportsTo",
      appId: obj.appId,
      tag: obj.tag,
    });

    await setupObjFields([objField]);
    await setupObjArrayFields([arrayField]);

    const result = await getManyObjs({
      objQuery: {
        appId: obj.appId,
        partQuery: {
          and: [
            { op: "eq", field: "name", value: "Test Object" },
            { op: "eq", field: "reportsTo.userId", value: "user1" },
          ],
        },
      },
      tag: obj.tag,
      storageType: backend.type,
    });

    expect(result.objs).toHaveLength(1);
    expect(result.objs[0].id).toBe(obj.id);
  });

  it("should handle empty array field queries gracefully", async () => {
    const obj = makeObjFields({
      objRecord: {
        reportsTo: [],
      },
    });

    await storage.create({ objs: [obj] });

    const arrayField = makeObjArrayField({
      field: "reportsTo",
      appId: obj.appId,
      tag: obj.tag,
    });

    await setupObjArrayFields([arrayField]);

    const result = await getManyObjs({
      objQuery: {
        appId: obj.appId,
        partQuery: {
          and: [{ op: "eq", field: "reportsTo.userId", value: "user1" }],
        },
      },
      tag: obj.tag,
      storageType: backend.type,
    });

    expect(result.objs).toHaveLength(0);
  });

  it("should handle array field queries with 'exists' operation", async () => {
    const obj = makeObjFields({
      objRecord: {
        reportsTo: [
          { userId: "user1", role: "admin", permissions: ["read", "write"] },
          { userId: "user2", role: "user" }, // no permissions field
        ],
      },
    });

    await storage.create({ objs: [obj] });

    const arrayField = makeObjArrayField({
      field: "reportsTo",
      appId: obj.appId,
      tag: obj.tag,
    });

    await setupObjArrayFields([arrayField]);

    const result = await getManyObjs({
      objQuery: {
        appId: obj.appId,
        partQuery: {
          and: [{ op: "exists", field: "reportsTo.permissions", value: true }],
        },
      },
      tag: obj.tag,
      storageType: backend.type,
    });

    expect(result.objs).toHaveLength(1);
    expect(result.objs[0].id).toBe(obj.id);
  });

  it("should handle array field queries with complex nested structures", async () => {
    const obj = makeObjFields({
      objRecord: {
        workflow: {
          steps: [
            {
              id: "step1",
              actions: [
                { type: "email", config: { template: "welcome" } },
                { type: "sms", config: { message: "Hello" } },
              ],
            },
            {
              id: "step2",
              actions: [
                { type: "webhook", config: { url: "https://api.example.com" } },
              ],
            },
          ],
        },
      },
    });

    await storage.create({ objs: [obj] });

    const arrayFields = [
      makeObjArrayField({
        field: "workflow.steps",
        appId: obj.appId,
        tag: obj.tag,
      }),
      makeObjArrayField({
        field: "workflow.steps.actions",
        appId: obj.appId,
        tag: obj.tag,
      }),
    ];

    await setupObjArrayFields(arrayFields);

    const result = await getManyObjs({
      objQuery: {
        appId: obj.appId,
        partQuery: {
          and: [
            { op: "eq", field: "workflow.steps.actions.type", value: "email" },
          ],
        },
      },
      tag: obj.tag,
      storageType: backend.type,
    });

    expect(result.objs).toHaveLength(1);
    expect(result.objs[0].id).toBe(obj.id);
  });

  it("should handle array field queries with 'between' operation", async () => {
    const obj = makeObjFields({
      objRecord: {
        scores: [
          { value: 85, category: "math" },
          { value: 92, category: "science" },
          { value: 78, category: "history" },
        ],
      },
    });

    await storage.create({ objs: [obj] });

    const arrayField = makeObjArrayField({
      field: "scores",
      appId: obj.appId,
      tag: obj.tag,
    });

    await setupObjArrayFields([arrayField]);

    const result = await getManyObjs({
      objQuery: {
        appId: obj.appId,
        partQuery: {
          and: [{ op: "between", field: "scores.value", value: [80, 95] }],
        },
      },
      tag: obj.tag,
      storageType: backend.type,
    });

    expect(result.objs).toHaveLength(1);
    expect(result.objs[0].id).toBe(obj.id);
  });

  it("should handle array field queries with array of primitives", async () => {
    const obj = makeObjFields({
      objRecord: {
        tags: ["javascript", "typescript", "react"],
        permissions: ["read", "write", "delete"],
      },
    });

    await storage.create({ objs: [obj] });

    const arrayField = makeObjArrayField({
      field: "tags",
      appId: obj.appId,
      tag: obj.tag,
    });

    await setupObjArrayFields([arrayField]);

    const result = await getManyObjs({
      objQuery: {
        appId: obj.appId,
        partQuery: { and: [{ op: "eq", field: "tags", value: "typescript" }] },
      },
      tag: obj.tag,
      storageType: backend.type,
    });

    expect(result.objs).toHaveLength(1);
    expect(result.objs[0].id).toBe(obj.id);
  });

  it("should handle getManyObjs with mixed array and scalar at same path", async () => {
    const obj1 = makeObjFields({
      objRecord: { reportsTo: [{ userId: "user1" }] },
    });
    const obj2 = makeObjFields({
      objRecord: { reportsTo: { userId: "user2" } },
    });
    await storage.create({ objs: [obj1, obj2] });
    const arrayField = makeObjArrayField({
      field: "reportsTo",
      appId: obj1.appId,
      tag: obj1.tag,
    });
    await setupObjArrayFields([arrayField]);
    // Should find obj1 for array, obj2 for scalar
    const result1 = await getManyObjs({
      objQuery: {
        appId: obj1.appId,
        partQuery: {
          and: [{ op: "eq", field: "reportsTo.userId", value: "user1" }],
        },
      },
      tag: obj1.tag,
      storageType: backend.type,
    });
    const result2 = await getManyObjs({
      objQuery: {
        appId: obj2.appId,
        partQuery: {
          and: [{ op: "eq", field: "reportsTo.userId", value: "user2" }],
        },
      },
      tag: obj2.tag,
      storageType: backend.type,
    });
    expect(result1.objs.some((o) => o.id === obj1.id)).toBe(true);
    expect(result2.objs.some((o) => o.id === obj2.id)).toBe(true);
  });
});
