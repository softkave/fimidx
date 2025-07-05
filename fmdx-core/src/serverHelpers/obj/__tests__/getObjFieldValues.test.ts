import { and, eq, inArray } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  db,
  objFields as objFieldsTable,
  objParts as objPartsTable,
} from "../../../db/fmdx.sqlite.js";
import { getObjFieldValues } from "../getObjFieldValues.js";

const TEST_APP_ID = "test-app-id-getObjFieldValues";
const TEST_GROUP_ID = "test-group-id-getObjFieldValues";
const TEST_TAG = "test-tag-getObjFieldValues";
const TEST_FIELD = `field_${uuidv7().slice(0, 8)}`;

function makeObjField(overrides = {}) {
  const now = new Date();
  return {
    id: uuidv7(),
    createdAt: now,
    updatedAt: now,
    appId: TEST_APP_ID,
    groupId: TEST_GROUP_ID,
    field: TEST_FIELD,
    fieldKeys: ["foo"],
    fieldKeyTypes: ["string"],
    valueTypes: ["string"],
    tag: TEST_TAG,
    ...overrides,
  };
}

function makeObjPart(overrides = {}) {
  const now = new Date();
  return {
    id: uuidv7(),
    objId: uuidv7(),
    field: TEST_FIELD,
    value: `value_${uuidv7().slice(0, 8)}`,
    valueNumber: null,
    valueBoolean: null,
    type: "string",
    appId: TEST_APP_ID,
    groupId: TEST_GROUP_ID,
    createdAt: now,
    updatedAt: now,
    tag: TEST_TAG,
    ...overrides,
  };
}

describe("getObjFieldValues integration", () => {
  let insertedFieldIds: string[] = [];
  let insertedPartIds: string[] = [];

  beforeAll(async () => {
    // Clean up any old test data
    await db
      .delete(objPartsTable)
      .where(
        and(
          eq(objPartsTable.appId, TEST_APP_ID),
          eq(objPartsTable.tag, TEST_TAG),
          eq(objPartsTable.field, TEST_FIELD)
        )
      );
    await db
      .delete(objFieldsTable)
      .where(
        and(
          eq(objFieldsTable.appId, TEST_APP_ID),
          eq(objFieldsTable.tag, TEST_TAG),
          eq(objFieldsTable.field, TEST_FIELD)
        )
      );
  });

  afterEach(async () => {
    if (insertedPartIds.length > 0) {
      await db
        .delete(objPartsTable)
        .where(inArray(objPartsTable.id, insertedPartIds));
      insertedPartIds = [];
    }
    if (insertedFieldIds.length > 0) {
      await db
        .delete(objFieldsTable)
        .where(inArray(objFieldsTable.id, insertedFieldIds));
      insertedFieldIds = [];
    }
  });

  afterAll(async () => {
    await db
      .delete(objPartsTable)
      .where(
        and(
          eq(objPartsTable.appId, TEST_APP_ID),
          eq(objPartsTable.tag, TEST_TAG),
          eq(objPartsTable.field, TEST_FIELD)
        )
      );
    await db
      .delete(objFieldsTable)
      .where(
        and(
          eq(objFieldsTable.appId, TEST_APP_ID),
          eq(objFieldsTable.tag, TEST_TAG),
          eq(objFieldsTable.field, TEST_FIELD)
        )
      );
  });

  it("returns empty result when no values exist", async () => {
    const result = await getObjFieldValues({
      appId: TEST_APP_ID,
      field: TEST_FIELD,
      tag: TEST_TAG,
    });
    expect(result.values).toEqual([]);
    expect(result.page).toBe(0);
    expect(result.limit).toBe(100);
    expect(result.hasMore).toBe(false);
  });

  it("returns inserted values and supports pagination", async () => {
    // Insert required objField for referential integrity
    const objField = makeObjField();
    await db.insert(objFieldsTable).values(objField);
    insertedFieldIds.push(objField.id);
    // Insert 3 objParts with unique values
    let counter = 0;
    const parts = [
      makeObjPart({ value: `value_${counter++}` }),
      makeObjPart({ value: `value_${counter++}` }),
      makeObjPart({ value: `value_${counter++}` }),
    ];
    await db.insert(objPartsTable).values(parts);
    insertedPartIds = parts.map((p) => p.id);
    // Page 0, limit 2
    let result = await getObjFieldValues({
      appId: TEST_APP_ID,
      field: TEST_FIELD,
      tag: TEST_TAG,
      page: 0,
      limit: 2,
    });
    expect(result.values.length).toBe(2);
    expect(result.page).toBe(0);
    expect(result.limit).toBe(2);
    expect(result.hasMore).toBe(true);
    // Page 1, limit 2
    result = await getObjFieldValues({
      appId: TEST_APP_ID,
      field: TEST_FIELD,
      tag: TEST_TAG,
      page: 1,
      limit: 2,
    });

    expect(result.values.length).toBe(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(2);
    expect(result.hasMore).toBe(false);
  });

  it("returns only values for the given appId, tag, and field", async () => {
    // Insert required objField for referential integrity
    const objField = makeObjField();
    await db.insert(objFieldsTable).values(objField);
    insertedFieldIds.push(objField.id);
    // Insert a part for a different app/tag/field
    const otherField = makeObjField({ field: "other-field", id: uuidv7() });
    await db.insert(objFieldsTable).values(otherField);
    insertedFieldIds.push(otherField.id);
    const otherPart = makeObjPart({
      appId: "other-app",
      tag: "other-tag",
      field: "other-field",
      value: "other-unique-value",
    });
    await db.insert(objPartsTable).values(otherPart);
    insertedPartIds.push(otherPart.id);
    // Insert a part for the test app/tag/field
    const testPart = makeObjPart({
      value: "test-unique-value",
    });
    await db.insert(objPartsTable).values(testPart);
    insertedPartIds.push(testPart.id);
    // Should only return the test app/tag/field value
    const result = await getObjFieldValues({
      appId: TEST_APP_ID,
      field: TEST_FIELD,
      tag: TEST_TAG,
    });
    const returnedValues = result.values.map(
      (v: { value: string; type: string }) => v.value
    );
    expect(returnedValues).toContain(testPart.value);
    expect(returnedValues).not.toContain(otherPart.value);
  });
});
