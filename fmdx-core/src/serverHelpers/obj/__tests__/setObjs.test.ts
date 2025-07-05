import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getObjModel } from "../../../db/fmdx.mongo.js";
import type {
  IInputObjRecord,
  ISetManyObjsEndpointArgs,
} from "../../../definitions/obj.js";
import { createStorage } from "../../../storage/config.js";
import { setManyObjs } from "../setObjs.js";

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

const defaultAppId = "test-app";
const defaultGroupId = "test-group";
const defaultTag = "test-tag";
const defaultBy = "tester";
const defaultByType = "user";

describe.each(backends)("setManyObjs integration (%s)", (backend) => {
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
      await model.deleteMany({ appId: defaultAppId, tag: defaultTag });
    } else if (backend.type === "postgres") {
      const { fmdxPostgresDb, objs } = await import(
        "../../../db/fmdx.postgres.js"
      );
      await fmdxPostgresDb
        .delete(objs)
        .where(and(eq(objs.appId, defaultAppId), eq(objs.tag, defaultTag)));
    }
  });

  it("creates new objects", async () => {
    const input: ISetManyObjsEndpointArgs = {
      appId: defaultAppId,
      items: [makeInputObjRecord({ foo: "bar" })],
    };
    const result = await setManyObjs({
      tag: defaultTag,
      input,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storageType: backend.type,
    });
    expect(result.newObjs.length).toBe(1);
    expect(result.updatedObjs.length).toBe(0);
    expect(result.ignoredItems.length).toBe(0);
    expect(result.failedItems.length).toBe(0);
    expect(result.newObjs[0].objRecord.foo).toBe("bar");
  });

  it("updates existing objects with onConflict=replace", async () => {
    // First insert
    const input1: ISetManyObjsEndpointArgs = {
      appId: defaultAppId,
      items: [makeInputObjRecord({ foo: "bar", unique: "u1" })],
      conflictOnKeys: ["unique"],
    };
    await setManyObjs({
      tag: defaultTag,
      input: input1,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storageType: backend.type,
    });
    // Second insert with same unique, different value
    const input2: ISetManyObjsEndpointArgs = {
      appId: defaultAppId,
      items: [makeInputObjRecord({ foo: "baz", unique: "u1" })],
      conflictOnKeys: ["unique"],
      onConflict: "replace",
    };
    const result = await setManyObjs({
      tag: defaultTag,
      input: input2,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storageType: backend.type,
    });
    expect(result.newObjs.length).toBe(0);
    expect(result.updatedObjs.length).toBe(1);
    expect(result.updatedObjs[0].objRecord.foo).toBe("baz");
  });

  it("ignores existing objects with onConflict=ignore", async () => {
    // First insert
    const input1: ISetManyObjsEndpointArgs = {
      appId: defaultAppId,
      items: [makeInputObjRecord({ foo: "bar", unique: "u2" })],
      conflictOnKeys: ["unique"],
    };
    await setManyObjs({
      tag: defaultTag,
      input: input1,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storageType: backend.type,
    });
    // Second insert with same unique, different value
    const input2: ISetManyObjsEndpointArgs = {
      appId: defaultAppId,
      items: [makeInputObjRecord({ foo: "baz", unique: "u2" })],
      conflictOnKeys: ["unique"],
      onConflict: "ignore",
    };
    const result = await setManyObjs({
      tag: defaultTag,
      input: input2,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storageType: backend.type,
    });
    expect(result.newObjs.length).toBe(0);
    expect(result.updatedObjs.length).toBe(0);
    expect(result.ignoredItems.length).toBe(1);
    expect(result.ignoredItems[0].foo).toBe("baz");
  });

  it("fails existing objects with onConflict=fail", async () => {
    // First insert
    const input1: ISetManyObjsEndpointArgs = {
      appId: defaultAppId,
      items: [makeInputObjRecord({ foo: "bar", unique: "u3" })],
      conflictOnKeys: ["unique"],
    };
    await setManyObjs({
      tag: defaultTag,
      input: input1,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storageType: backend.type,
    });
    // Second insert with same unique, different value
    const input2: ISetManyObjsEndpointArgs = {
      appId: defaultAppId,
      items: [makeInputObjRecord({ foo: "baz", unique: "u3" })],
      conflictOnKeys: ["unique"],
      onConflict: "fail",
    };
    const result = await setManyObjs({
      tag: defaultTag,
      input: input2,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storageType: backend.type,
    });
    expect(result.newObjs.length).toBe(0);
    expect(result.updatedObjs.length).toBe(0);
    expect(result.failedItems.length).toBe(1);
    expect(result.failedItems[0].foo).toBe("baz");
  });

  it("can insert multiple objects in one call", async () => {
    const input: ISetManyObjsEndpointArgs = {
      appId: defaultAppId,
      items: [
        makeInputObjRecord({ foo: "multi1" }),
        makeInputObjRecord({ foo: "multi2" }),
      ],
    };
    const result = await setManyObjs({
      tag: defaultTag,
      input,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storageType: backend.type,
    });
    expect(result.newObjs.length).toBe(2);
    const foos = result.newObjs.map((o) => o.objRecord.foo);
    expect(foos).toContain("multi1");
    expect(foos).toContain("multi2");
  });

  it("respects shouldIndex and fieldsToIndex", async () => {
    const input: ISetManyObjsEndpointArgs = {
      appId: defaultAppId,
      items: [makeInputObjRecord({ foo: "index" })],
      shouldIndex: false,
      fieldsToIndex: ["foo", "bar", "foo"],
    };
    const result = await setManyObjs({
      tag: defaultTag,
      input,
      by: defaultBy,
      byType: defaultByType,
      groupId: defaultGroupId,
      storageType: backend.type,
    });
    expect(result.newObjs.length).toBe(1);
    expect(result.newObjs[0].shouldIndex).toBe(false);
    expect(result.newObjs[0].fieldsToIndex).toEqual(["foo", "bar"]);
  });
});
