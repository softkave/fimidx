import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  db,
  objFields as objFieldsTable,
  objParts as objPartsTable,
} from "../../../db/fmdx.sqlite.js";
import { getObjModel } from "../../../db/mongo.js";
import type { IAppObjRecord } from "../../../definitions/app.js";
import type { IInputObjRecord, IObj } from "../../../definitions/obj.js";
import { createStorage } from "../../../storage/config.js";
import { addApp } from "../../app/addApp.js";
import { indexObjs } from "../indexObjs.js";

const backends: { type: "mongo" | "postgres"; name: string }[] = [
  { type: "mongo", name: "MongoDB" },
  { type: "postgres", name: "Postgres" },
];

const TEST_APP_ID = "test-app-indexObjs";
const TEST_GROUP_ID = "test-group-indexObjs";
const TEST_TAG = "test-tag-indexObjs";

function makeInputObjRecord(
  overrides: Partial<IInputObjRecord> = {}
): IInputObjRecord {
  return {
    name: "Test Object",
    value: Math.random(),
    nested: {
      deep: {
        field: "nested-value",
        number: 42,
        boolean: true,
      },
    },
    array: ["item1", "item2", "item3"],
    ...overrides,
  };
}

function makeObj(overrides: Partial<IObj> = {}): IObj {
  const now = new Date();
  return {
    id: uuidv7(),
    createdAt: now,
    updatedAt: now,
    createdBy: "tester",
    createdByType: "user",
    updatedBy: "tester",
    updatedByType: "user",
    appId: TEST_APP_ID,
    groupId: TEST_GROUP_ID,
    tag: TEST_TAG,
    objRecord: makeInputObjRecord(),
    deletedAt: null,
    deletedBy: null,
    deletedByType: null,
    shouldIndex: true,
    fieldsToIndex: null,
    ...overrides,
  };
}

function makeApp(overrides: Partial<IAppObjRecord> = {}): IAppObjRecord {
  return {
    name: "Test App",
    description: "Test app for indexObjs",
    groupId: TEST_GROUP_ID,
    objFieldsToIndex: ["name", "value", "nested.deep.field"],
    ...overrides,
  };
}

describe.each(backends)("indexObjs integration (%s)", (backend) => {
  let storage: ReturnType<typeof createStorage>;
  let cleanup: (() => Promise<void>) | undefined;
  let testAppId: string;

  beforeAll(async () => {
    storage = createStorage({ type: backend.type });

    // Setup MongoDB connection if needed
    if (backend.type === "mongo") {
      const model = getObjModel();
      if (model && model.db && model.db.asPromise) {
        await model.db.asPromise();
      }
      cleanup = async () => {
        await model.db.close();
      };
    }

    // Create a test app
    const appRecord = makeApp();
    const { app } = await addApp({
      args: {
        name: appRecord.name,
        description: appRecord.description || undefined,
        groupId: appRecord.groupId,
        objFieldsToIndex: appRecord.objFieldsToIndex || undefined,
      },
      by: "tester",
      byType: "user",
    });
    testAppId = app.id;
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  beforeEach(async () => {
    // Clean up test data
    if (backend.type === "mongo") {
      const model = getObjModel();
      await model.deleteMany({
        appId: TEST_APP_ID,
        tag: TEST_TAG,
      });
    } else if (backend.type === "postgres") {
      const { fmdxPostgresDb, objs } = await import(
        "../../../db/fmdx.postgres.js"
      );
      await fmdxPostgresDb
        .delete(objs)
        .where(and(eq(objs.appId, TEST_APP_ID), eq(objs.tag, TEST_TAG)));
    }

    // Clean up SQLite tables
    await db
      .delete(objFieldsTable)
      .where(
        and(
          eq(objFieldsTable.appId, TEST_APP_ID),
          eq(objFieldsTable.tag, TEST_TAG)
        )
      );

    await db
      .delete(objPartsTable)
      .where(
        and(
          eq(objPartsTable.appId, TEST_APP_ID),
          eq(objPartsTable.tag, TEST_TAG)
        )
      );
  });

  describe("indexObjs function", () => {
    it("should index objects that should be indexed", async () => {
      // Create objects that should be indexed
      const objs = [
        makeObj({ shouldIndex: true, objRecord: { name: "obj1", value: 100 } }),
        makeObj({ shouldIndex: true, objRecord: { name: "obj2", value: 200 } }),
        makeObj({
          shouldIndex: false,
          objRecord: { name: "obj3", value: 300 },
        }), // Should not be indexed
      ];

      await storage.create({ objs });

      // Run indexObjs
      await indexObjs({ lastSuccessAt: null, storageType: backend.type });

      // Check that objFields were created for indexed objects
      const fields = await db
        .select()
        .from(objFieldsTable)
        .where(
          and(
            eq(objFieldsTable.appId, TEST_APP_ID),
            eq(objFieldsTable.tag, TEST_TAG)
          )
        );

      expect(fields.length).toBeGreaterThan(0);

      // Should have fields for "name" and "value" from the indexed objects
      const fieldNames = fields.map((f) => f.field);
      expect(fieldNames).toContain("name");
      expect(fieldNames).toContain("value");

      // Check that objParts were created
      const parts = await db
        .select()
        .from(objPartsTable)
        .where(
          and(
            eq(objPartsTable.appId, TEST_APP_ID),
            eq(objPartsTable.tag, TEST_TAG)
          )
        );

      expect(parts.length).toBeGreaterThan(0);

      // Should have parts for the indexed objects only
      const indexedObjIds = objs.filter((o) => o.shouldIndex).map((o) => o.id);
      const partObjIds = [...new Set(parts.map((p) => p.objId))];
      expect(partObjIds).toEqual(expect.arrayContaining(indexedObjIds));
    });

    it("should respect lastSuccessAt parameter", async () => {
      const oldDate = new Date("2023-01-01T00:00:00.000Z");
      const recentDate = new Date();

      // Create objects with different update times
      const oldObj = makeObj({
        shouldIndex: true,
        updatedAt: oldDate,
        objRecord: { name: "old-obj" },
      });
      const recentObj = makeObj({
        shouldIndex: true,
        updatedAt: recentDate,
        objRecord: { name: "recent-obj" },
      });

      await storage.create({ objs: [oldObj, recentObj] });

      // Run indexObjs with lastSuccessAt set to a date after oldObj but before recentObj
      const lastSuccessAt = new Date("2023-06-01T00:00:00.000Z");
      await indexObjs({ lastSuccessAt, storageType: backend.type });

      // Should only index the recent object
      const parts = await db
        .select()
        .from(objPartsTable)
        .where(
          and(
            eq(objPartsTable.appId, TEST_APP_ID),
            eq(objPartsTable.tag, TEST_TAG)
          )
        );

      const partObjIds = [...new Set(parts.map((p) => p.objId))];
      expect(partObjIds).toContain(recentObj.id);
      expect(partObjIds).not.toContain(oldObj.id);
    });

    it("should handle app-specific fieldsToIndex", async () => {
      // Create an app with specific fields to index
      const appWithFields = makeApp({
        objFieldsToIndex: ["name", "nested.deep.field"],
      });

      const { app } = await addApp({
        args: {
          name: appWithFields.name + "-specific",
          description: appWithFields.description || undefined,
          groupId: appWithFields.groupId,
          objFieldsToIndex: appWithFields.objFieldsToIndex || undefined,
        },
        by: "tester",
        byType: "user",
      });

      // Create objects with the new app ID
      const objs = [
        makeObj({
          appId: app.id,
          shouldIndex: true,
          objRecord: {
            name: "test-name",
            value: "should-not-index",
            nested: { deep: { field: "should-index" } },
          },
        }),
      ];

      await storage.create({ objs });

      // Run indexObjs
      await indexObjs({ lastSuccessAt: null, storageType: backend.type });

      // Check that only the specified fields were indexed
      const parts = await db
        .select()
        .from(objPartsTable)
        .where(
          and(eq(objPartsTable.appId, app.id), eq(objPartsTable.tag, TEST_TAG))
        );

      const partFields = parts.map((p) => p.field);
      expect(partFields).toContain("name");
      expect(partFields).toContain("nested.deep.field");
      expect(partFields).not.toContain("value");
    });

    it("should handle object-specific fieldsToIndex", async () => {
      // Create objects with their own fieldsToIndex
      const objs = [
        makeObj({
          shouldIndex: true,
          fieldsToIndex: ["name", "value"],
          objRecord: {
            name: "test-name",
            value: "test-value",
            nested: { deep: { field: "should-not-index" } },
          },
        }),
      ];

      await storage.create({ objs });

      // Run indexObjs
      await indexObjs({ lastSuccessAt: null, storageType: backend.type });

      // Check that only the object-specific fields were indexed
      const parts = await db
        .select()
        .from(objPartsTable)
        .where(
          and(
            eq(objPartsTable.appId, TEST_APP_ID),
            eq(objPartsTable.tag, TEST_TAG)
          )
        );

      const partFields = parts.map((p) => p.field);
      expect(partFields).toContain("name");
      expect(partFields).toContain("value");
      expect(partFields).not.toContain("nested.deep.field");
    });

    it("should handle different data types correctly", async () => {
      const objs = [
        makeObj({
          shouldIndex: true,
          objRecord: {
            stringField: "string-value",
            numberField: 42,
            booleanField: true,
            nullField: null,
            arrayField: ["item1", "item2"],
            nestedField: { key: "value" },
          },
        }),
      ];

      await storage.create({ objs });

      await indexObjs({ lastSuccessAt: null, storageType: backend.type });

      // Check that different types are handled correctly
      const parts = await db
        .select()
        .from(objPartsTable)
        .where(
          and(
            eq(objPartsTable.appId, TEST_APP_ID),
            eq(objPartsTable.tag, TEST_TAG)
          )
        );

      const stringPart = parts.find((p) => p.field === "stringField");
      const numberPart = parts.find((p) => p.field === "numberField");
      const booleanPart = parts.find((p) => p.field === "booleanField");
      const nullPart = parts.find((p) => p.field === "nullField");

      expect(stringPart).toBeDefined();
      expect(stringPart?.type).toBe("string");
      expect(stringPart?.value).toBe("string-value");
      expect(stringPart?.valueNumber).toBeNull();

      expect(numberPart).toBeDefined();
      expect(numberPart?.type).toBe("number");
      expect(numberPart?.value).toBe("42");
      expect(numberPart?.valueNumber).toBe(42);

      expect(booleanPart).toBeDefined();
      expect(booleanPart?.type).toBe("boolean");
      expect(booleanPart?.value).toBe("true");
      expect(booleanPart?.valueBoolean).toBe(true);

      expect(nullPart).toBeDefined();
      expect(nullPart?.type).toBe("null");
      expect(nullPart?.value).toBe("null");
    });

    it("should handle pagination correctly", async () => {
      // Create more objects than the batch size
      const objs = Array.from({ length: 1500 }, (_, i) =>
        makeObj({
          shouldIndex: true,
          objRecord: { name: `obj-${i}`, value: i },
        })
      );

      await storage.create({ objs });

      await indexObjs({ lastSuccessAt: null, storageType: backend.type });

      // Check that all objects were indexed
      const parts = await db
        .select()
        .from(objPartsTable)
        .where(
          and(
            eq(objPartsTable.appId, TEST_APP_ID),
            eq(objPartsTable.tag, TEST_TAG)
          )
        );

      const uniqueObjIds = [...new Set(parts.map((p) => p.objId))];
      expect(uniqueObjIds.length).toBe(1500);
    });

    it("should update existing fields and parts", async () => {
      // Create initial object
      const obj = makeObj({
        shouldIndex: true,
        objRecord: { name: "initial-name", value: 100 },
      });

      await storage.create({ objs: [obj] });

      // Run indexObjs first time
      await indexObjs({ lastSuccessAt: null, storageType: backend.type });

      // Update the object
      const updatedObj = {
        ...obj,
        objRecord: { name: "updated-name", value: 200, newField: "new-value" },
        updatedAt: new Date(),
      };

      await storage.update({
        query: { appId: TEST_APP_ID },
        tag: TEST_TAG,
        update: {
          objRecord: updatedObj.objRecord,
          updatedAt: updatedObj.updatedAt,
        },
        by: "tester",
        byType: "user",
      });

      // Run indexObjs again
      await indexObjs({ lastSuccessAt: null, storageType: backend.type });

      // Check that fields were updated
      const fields = await db
        .select()
        .from(objFieldsTable)
        .where(
          and(
            eq(objFieldsTable.appId, TEST_APP_ID),
            eq(objFieldsTable.tag, TEST_TAG)
          )
        );

      const fieldNames = fields.map((f) => f.field);
      expect(fieldNames).toContain("name");
      expect(fieldNames).toContain("value");
      expect(fieldNames).toContain("newField");

      // Check that parts were updated
      const parts = await db
        .select()
        .from(objPartsTable)
        .where(and(eq(objPartsTable.objId, obj.id)));

      const namePart = parts.find((p) => p.field === "name");
      const valuePart = parts.find((p) => p.field === "value");
      const newFieldPart = parts.find((p) => p.field === "newField");

      expect(namePart?.value).toBe("updated-name");
      expect(valuePart?.value).toBe("200");
      expect(valuePart?.valueNumber).toBe(200);
      expect(newFieldPart?.value).toBe("new-value");
    });

    it("should handle empty result sets", async () => {
      // Run indexObjs with no objects to index
      await indexObjs({ lastSuccessAt: null, storageType: backend.type });

      // Should not throw and should not create any fields or parts
      const fields = await db
        .select()
        .from(objFieldsTable)
        .where(
          and(
            eq(objFieldsTable.appId, TEST_APP_ID),
            eq(objFieldsTable.tag, TEST_TAG)
          )
        );

      const parts = await db
        .select()
        .from(objPartsTable)
        .where(
          and(
            eq(objPartsTable.appId, TEST_APP_ID),
            eq(objPartsTable.tag, TEST_TAG)
          )
        );

      expect(fields.length).toBe(0);
      expect(parts.length).toBe(0);
    });
  });
});
