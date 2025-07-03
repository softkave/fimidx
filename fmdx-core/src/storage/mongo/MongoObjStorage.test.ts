import assert from "assert";
import { v7 as uuidv7 } from "uuid";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getObjModel } from "../../db/mongo.js";
import type { IInputObjRecord, IObj } from "../../definitions/obj.js";
import { MongoObjStorage } from "./MongoObjStorage.js";

const REQUIRED_ENV_VARS = ["MONGO_URI", "MONGO_DB_NAME"];

function checkEnv() {
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
}

describe("MongoObjStorage (integration)", () => {
  let storage: MongoObjStorage;
  let objModel: ReturnType<typeof getObjModel>;

  beforeAll(async () => {
    checkEnv();
    objModel = getObjModel();
    storage = new MongoObjStorage(objModel);
    // Wait for connection
    await objModel.db.asPromise();
  });

  afterAll(async () => {
    await objModel.db.close();
  });

  beforeEach(async () => {
    // Clean up the collection before each test
    await objModel.deleteMany({});
  });

  function makeInputObjRecord(
    overrides: Partial<IInputObjRecord> = {}
  ): IInputObjRecord {
    return {
      name: "Test Object",
      value: Math.random(),
      ...overrides,
    };
  }

  function makeObjFields(overrides: Partial<IObj> = {}): Partial<IObj> {
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

  it("should create objects", async () => {
    const obj = makeObjFields();
    const result = await storage.create({ objs: [obj as IObj] });
    expect(result.objs).toHaveLength(1);
    const inDb = await objModel.findOne({ id: obj.id }).lean();
    expect(inDb).toBeTruthy();
    if (!inDb) throw new Error("Object not found in DB");
    expect(inDb.id ?? "").toBe(obj.id ?? "");
    expect(inDb.objRecord?.name ?? "").toBe("Test Object");
  });

  it("should read objects", async () => {
    const obj = makeObjFields();
    await objModel.create(obj);
    assert(obj.appId);
    assert(obj.tag);
    const result = await storage.read({
      query: { appId: obj.appId },
      tag: obj.tag,
      limit: 10,
    });
    expect(result.objs.length).toBeGreaterThanOrEqual(1);
    expect(result.objs[0]?.id ?? "").toBe(obj.id ?? "");
  });

  it("should update objects", async () => {
    const obj = makeObjFields();
    await objModel.create(obj);
    assert(obj.appId);
    assert(obj.tag);
    const newName = "Updated Name";
    const result = await storage.update({
      query: { appId: obj.appId },
      tag: obj.tag,
      update: { name: newName },
      by: "updater",
      byType: "user",
    });
    expect(result.updatedCount).toBeGreaterThanOrEqual(1);
    const updated = await objModel.findOne({ id: obj.id }).lean();
    expect(updated).toBeTruthy();
    if (!updated) throw new Error("Updated object not found in DB");
    expect(updated.objRecord?.name ?? "").toBe(newName);
    expect(updated.updatedBy ?? "").toBe("updater");
  });

  it("should soft-delete objects", async () => {
    const obj = makeObjFields();
    await objModel.create(obj);
    assert(obj.appId);
    assert(obj.tag);
    const result = await storage.delete({
      query: { appId: obj.appId },
      tag: obj.tag,
      deletedBy: "deleter",
      deletedByType: "user",
    });
    expect(result.deletedCount).toBeGreaterThanOrEqual(1);
    const deleted = await objModel.findOne({ id: obj.id }).lean();
    expect(deleted).toBeTruthy();
    if (!deleted) throw new Error("Deleted object not found in DB");
    expect(deleted.deletedAt).toBeTruthy();
    expect(deleted.deletedBy ?? "").toBe("deleter");
  });

  it("should bulk upsert objects", async () => {
    const items = [
      makeInputObjRecord({ name: "Bulk1" }),
      makeInputObjRecord({ name: "Bulk2" }),
    ];
    const params = {
      items,
      conflictOnKeys: ["name"],
      onConflict: "replace" as const,
      tag: "bulk-tag",
      appId: "bulk-app",
      groupId: "bulk-group",
      createdBy: "bulk-tester",
      createdByType: "user",
      shouldIndex: true,
    };
    const result = await storage.bulkUpsert(params);
    expect(result.newObjs.length).toBe(2);
    // Upsert again with same names, should update not insert
    const result2 = await storage.bulkUpsert({ ...params });
    expect(result2.updatedObjs.length).toBe(2);
    expect(result2.newObjs.length).toBe(0);
  });

  it("should respect conflict resolution: ignore", async () => {
    const items = [makeInputObjRecord({ name: "Conflict1", arr: [1] })];
    const params = {
      items,
      conflictOnKeys: ["name"],
      onConflict: "replace" as const,
      tag: "conflict-tag",
      appId: "conflict-app",
      groupId: "conflict-group",
      createdBy: "conflict-tester",
      createdByType: "user",
      shouldIndex: true,
    };
    await storage.bulkUpsert(params);
    // Try upsert with ignore
    const paramsIgnore = { ...params, onConflict: "ignore" as const };
    const result = await storage.bulkUpsert(paramsIgnore);
    expect(result.ignoredItems.length).toBe(1);
    expect(result.updatedObjs.length).toBe(0);
    expect(result.newObjs.length).toBe(0);
  });

  it("should respect conflict resolution: fail", async () => {
    const items = [makeInputObjRecord({ name: "Fail1" })];
    const params = {
      items,
      conflictOnKeys: ["name"],
      onConflict: "replace" as const,
      tag: "fail-tag",
      appId: "fail-app",
      groupId: "fail-group",
      createdBy: "fail-tester",
      createdByType: "user",
      shouldIndex: true,
    };
    await storage.bulkUpsert(params);
    // Try upsert with fail
    const paramsFail = { ...params, onConflict: "fail" as const };
    const result = await storage.bulkUpsert(paramsFail);
    expect(result.failedItems.length).toBe(1);
    expect(result.updatedObjs.length).toBe(0);
    expect(result.newObjs.length).toBe(0);
  });

  it("should merge fields with merge strategy", async () => {
    const obj = makeObjFields({ objRecord: { a: 1, b: 2 } });
    await objModel.create(obj);
    assert(obj.appId);
    assert(obj.tag);
    await storage.update({
      query: { appId: obj.appId },
      tag: obj.tag,
      update: { b: 3, c: 4 },
      by: "merger",
      byType: "user",
      updateWay: "merge",
    });
    const updated = await objModel.findOne({ id: obj.id }).lean();
    expect(updated).toBeTruthy();
    if (!updated) throw new Error("Updated object not found in DB");
    expect(updated.objRecord.a).toBe(1);
    expect(updated.objRecord.b).toBe(3);
    expect(updated.objRecord.c).toBe(4);
  });

  it("should merge arrays with mergeButReplaceArrays", async () => {
    const obj = makeObjFields({ objRecord: { arr: [1, 2], x: 1 } });
    await objModel.create(obj);
    assert(obj.appId);
    assert(obj.tag);
    await storage.update({
      query: { appId: obj.appId },
      tag: obj.tag,
      update: { arr: [3, 4] },
      by: "merger",
      byType: "user",
      updateWay: "mergeButReplaceArrays",
    });
    const updated = await objModel.findOne({ id: obj.id }).lean();
    expect(updated).toBeTruthy();
    if (!updated) throw new Error("Updated object not found in DB");
    expect(Array.isArray(updated.objRecord.arr)).toBe(true);
    expect(updated.objRecord.arr).toEqual([3, 4]);
  });

  it("should merge arrays with mergeButConcatArrays", async () => {
    const obj = makeObjFields({ objRecord: { arr: [1, 2] } });
    await objModel.create(obj);
    assert(obj.appId);
    assert(obj.tag);
    await storage.update({
      query: { appId: obj.appId },
      tag: obj.tag,
      update: { arr: [3, 4] },
      by: "merger",
      byType: "user",
      updateWay: "mergeButConcatArrays",
    });
    const updated = await objModel.findOne({ id: obj.id }).lean();
    expect(updated).toBeTruthy();
    if (!updated) throw new Error("Updated object not found in DB");
    expect(updated.objRecord.arr).toEqual([1, 2, 3, 4]);
  });

  it("should merge arrays with mergeButKeepArrays", async () => {
    const obj = makeObjFields({ objRecord: { arr: [1, 2] } });
    await objModel.create(obj);
    assert(obj.appId);
    assert(obj.tag);
    await storage.update({
      query: { appId: obj.appId },
      tag: obj.tag,
      update: { arr: [3, 4] },
      by: "merger",
      byType: "user",
      updateWay: "mergeButKeepArrays",
    });
    const updated = await objModel.findOne({ id: obj.id }).lean();
    expect(updated).toBeTruthy();
    if (!updated) throw new Error("Updated object not found in DB");
    expect(updated.objRecord.arr).toEqual([1, 2]);
  });

  it("should process items in batches in bulkUpsert", async () => {
    const items = Array.from({ length: 7 }, (_, i) =>
      makeInputObjRecord({ name: `Batch${i}` })
    );
    const params = {
      items,
      conflictOnKeys: ["name"],
      onConflict: "replace" as const,
      tag: "batch-tag",
      appId: "batch-app",
      groupId: "batch-group",
      createdBy: "batch-tester",
      createdByType: "user",
      shouldIndex: true,
      batchSize: 3,
    };
    const result = await storage.bulkUpsert(params);
    expect(result.newObjs.length).toBe(7);
    // Upsert again, should update all
    const result2 = await storage.bulkUpsert(params);
    expect(result2.updatedObjs.length).toBe(7);
  });

  it("should process items in batches in bulkUpdate", async () => {
    const objs = Array.from({ length: 5 }, (_, i) =>
      makeObjFields({
        objRecord: { name: `BulkUpd${i}` },
        appId: "bulkupd-app",
        tag: "bulkupd-tag",
      })
    );
    await objModel.insertMany(objs);
    const result = await storage.bulkUpdate({
      query: { appId: "bulkupd-app" },
      tag: "bulkupd-tag",
      update: { updated: true },
      by: "batch-updater",
      byType: "user",
      batchSize: 2,
    });
    expect(result.updatedCount).toBe(5);
    const updatedObjs = await objModel
      .find({ appId: "bulkupd-app", tag: "bulkupd-tag" })
      .lean();
    updatedObjs.forEach((obj) =>
      expect(obj.objRecord?.updated ?? false).toBe(true)
    );
  });

  it("should rollback on transaction error", async () => {
    const obj = makeObjFields();
    await storage.create({ objs: [obj as IObj] });
    let errorCaught = false;
    try {
      await storage.withTransaction(async (txStorage) => {
        await txStorage.update({
          query: { appId: String(obj.appId) },
          tag: String(obj.tag),
          update: { name: "TxFail" },
          by: "tx",
          byType: "user",
        });
        throw new Error("fail tx");
      });
    } catch (e) {
      errorCaught = true;
    }
    expect(errorCaught).toBe(true);
    const inDb = await objModel.findOne({ id: obj.id }).lean();
    expect(inDb?.objRecord?.name ?? "").not.toBe("TxFail");
  });

  it("should commit on successful transaction", async () => {
    const obj = makeObjFields();
    await storage.create({ objs: [obj as IObj] });
    await storage.withTransaction(async (txStorage) => {
      await txStorage.update({
        query: { appId: String(obj.appId) },
        tag: String(obj.tag),
        update: { name: "TxSuccess" },
        by: "tx",
        byType: "user",
      });
    });
    const inDb = await objModel.findOne({ id: obj.id }).lean();
    expect(inDb?.objRecord?.name ?? "").toBe("TxSuccess");
  });

  describe("complex queries", () => {
    it("should query nested fields (objRecord.user.name)", async () => {
      const obj1 = makeObjFields({
        objRecord: { user: { name: "john", age: 30 } },
        tag: "nested-tag",
        appId: "nested-app",
      });
      const obj2 = makeObjFields({
        objRecord: { user: { name: "jane", age: 25 } },
        tag: "nested-tag",
        appId: "nested-app",
      });
      await objModel.insertMany([obj1, obj2]);
      const result = await storage.read({
        query: {
          appId: "nested-app",
          partQuery: {
            and: [{ op: "eq", field: "user.name", value: "john" }],
          },
        },
        tag: "nested-tag",
      });
      expect(result.objs.length).toBe(1);
      expect(result.objs[0].objRecord.user.name).toBe("john");
    });

    it("should query arrays with in (objRecord.metadata.tags)", async () => {
      const obj1 = makeObjFields({
        objRecord: { metadata: { tags: ["important", "urgent"] } },
        tag: "array-tag",
        appId: "array-app",
      });
      const obj2 = makeObjFields({
        objRecord: { metadata: { tags: ["other"] } },
        tag: "array-tag",
        appId: "array-app",
      });
      await objModel.insertMany([obj1, obj2]);
      const result = await storage.read({
        query: {
          appId: "array-app",
          partQuery: {
            and: [
              {
                op: "in",
                field: "metadata.tags",
                value: ["important", "urgent"],
              },
            ],
          },
        },
        tag: "array-tag",
      });
      expect(result.objs.length).toBe(1);
      expect(result.objs[0].objRecord.metadata.tags).toContain("important");
    });

    it("should query boolean field existence (objRecord.settings.enabled)", async () => {
      const obj1 = makeObjFields({
        objRecord: { settings: { enabled: true } },
        tag: "exists-tag",
        appId: "exists-app",
      });
      const obj2 = makeObjFields({
        objRecord: { settings: {} },
        tag: "exists-tag",
        appId: "exists-app",
      });
      await objModel.insertMany([obj1, obj2]);
      const result = await storage.read({
        query: {
          appId: "exists-app",
          partQuery: {
            and: [{ op: "exists", field: "settings.enabled", value: true }],
          },
        },
        tag: "exists-tag",
      });
      expect(result.objs.length).toBe(1);
      expect(result.objs[0].objRecord.settings.enabled).toBe(true);
    });

    it("should query numeric comparisons (objRecord.stats.views >= 1000)", async () => {
      const obj1 = makeObjFields({
        objRecord: { stats: { views: 1500 } },
        tag: "num-tag",
        appId: "num-app",
      });
      const obj2 = makeObjFields({
        objRecord: { stats: { views: 500 } },
        tag: "num-tag",
        appId: "num-app",
      });
      await objModel.insertMany([obj1, obj2]);
      const result = await storage.read({
        query: {
          appId: "num-app",
          partQuery: {
            and: [{ op: "gte", field: "stats.views", value: 1000 }],
          },
        },
        tag: "num-tag",
      });
      expect(result.objs.length).toBe(1);
      expect(result.objs[0].objRecord.stats.views).toBe(1500);
    });

    it("should query numeric between (objRecord.created between [2020, 2025])", async () => {
      const obj1 = makeObjFields({
        objRecord: { created: 2022 },
        tag: "between-tag",
        appId: "between-app",
      });
      const obj2 = makeObjFields({
        objRecord: { created: 2019 },
        tag: "between-tag",
        appId: "between-app",
      });
      await objModel.insertMany([obj1, obj2]);
      const result = await storage.read({
        query: {
          appId: "between-app",
          partQuery: {
            and: [{ op: "between", field: "created", value: [2020, 2025] }],
          },
        },
        tag: "between-tag",
      });
      expect(result.objs.length).toBe(1);
      expect(result.objs[0].objRecord.created).toBe(2022);
    });

    it("should support logical AND/OR", async () => {
      const obj1 = makeObjFields({
        objRecord: { status: "active", score: 200 },
        tag: "logic-tag",
        appId: "logic-app",
      });
      const obj2 = makeObjFields({
        objRecord: { status: "inactive", score: 50 },
        tag: "logic-tag",
        appId: "logic-app",
      });
      const obj3 = makeObjFields({
        objRecord: { status: "active", score: 80 },
        tag: "logic-tag",
        appId: "logic-app",
      });
      await objModel.insertMany([obj1, obj2, obj3]);
      const result = await storage.read({
        query: {
          appId: "logic-app",
          partQuery: {
            and: [
              { op: "eq", field: "status", value: "active" },
              { op: "gt", field: "score", value: 100 },
            ],
            or: [
              { op: "eq", field: "status", value: "inactive" },
              { op: "lt", field: "score", value: 100 },
            ],
          },
        },
        tag: "logic-tag",
      });
      // Should match obj1 (AND) and obj2/obj3 (OR)
      const ids = result.objs.map((o) => o.id);
      expect(ids).toContain(obj1.id);
      expect(ids).toContain(obj2.id);
      expect(ids).toContain(obj3.id);
    });

    it("should support meta queries (createdAt, updatedBy)", async () => {
      const now = new Date();
      const obj1 = makeObjFields({
        createdAt: now,
        updatedBy: "user1",
        tag: "meta-tag",
        appId: "meta-app",
      });
      const obj2 = makeObjFields({
        createdAt: new Date(now.getTime() - 100000000),
        updatedBy: "user2",
        tag: "meta-tag",
        appId: "meta-app",
      });
      await objModel.insertMany([obj1, obj2]);
      const result = await storage.read({
        query: {
          appId: "meta-app",
          metaQuery: {
            createdAt: {
              gte: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
            },
            updatedBy: { in: ["user1"] },
          },
        },
        tag: "meta-tag",
      });
      expect(result.objs.length).toBe(1);
      expect(result.objs[0].updatedBy).toBe("user1");
    });
  });
});
