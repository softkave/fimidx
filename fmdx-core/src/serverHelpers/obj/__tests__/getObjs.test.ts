import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getObjModel } from "../../../db/fmdx.mongo.js";
import { db, objFields as objFieldsTable } from "../../../db/fmdx.sqlite.js";
import type {
  IInputObjRecord,
  IObj,
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
});
