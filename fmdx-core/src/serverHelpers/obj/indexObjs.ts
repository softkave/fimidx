import { and, eq, inArray } from "drizzle-orm";
import { forEach, groupBy, uniq } from "lodash-es";
import { LRUCache } from "lru-cache";
import { indexJson } from "softkave-js-utils";
import { v7 as uuidv7 } from "uuid";
import {
  db,
  objFields as objFieldsTable,
  objParts as objPartsTable,
} from "../../db/fmdx.sqlite.js";
import type { IApp } from "../../definitions/app.js";
import type { IObj, IObjField, IObjPart } from "../../definitions/obj.js";
import { createStorage, getDefaultStorageType } from "../../storage/config.js";
import type { IObjStorage } from "../../storage/types.js";
import { getApps } from "../app/getApps.js";

const batchSize = 1000;

async function indexObjFields(params: {
  objs: IObj[];
  indexList: ReturnType<typeof indexJson>[];
}) {
  const { objs, indexList } = params;

  type IWorkingObjField = {
    field: string;
    fieldKeys: Array<string | number>;
    fieldKeyTypes: string[];
    valueTypes: Set<string>;
    appId: string;
    groupId: string;
    tag: string;
    createdAt: Date;
    updatedAt: Date;
  };

  const fieldsSet = new Map<string, IWorkingObjField>();
  indexList.forEach((index, objIndex) => {
    const obj = objs[objIndex];
    forEach(index, (value, stringKey) => {
      // const fieldKey = `${obj.appId}-${obj.groupId}-${stringKey}`;
      let field: IWorkingObjField | undefined = fieldsSet.get(stringKey);

      if (!field) {
        field = {
          field: stringKey,
          fieldKeys: value.key,
          fieldKeyTypes: value.keyType,
          valueTypes: new Set<string>(),
          appId: obj.appId,
          groupId: obj.groupId,
          tag: obj.tag,
          createdAt: obj.createdAt,
          updatedAt: obj.updatedAt,
        };
        fieldsSet.set(stringKey, field);
      }

      value.valueType.forEach((type) => {
        field.valueTypes.add(type);
      });
    });
  });

  const fields = Array.from(fieldsSet.values());

  let batchSize = 100;
  let batchIndex = 0;
  while (batchIndex < fields.length) {
    const batch = fields.slice(batchIndex, batchIndex + batchSize);
    const existingFields = await db
      .select()
      .from(objFieldsTable)
      .where(
        and(
          inArray(
            objFieldsTable.field,
            batch.map((field) => field.field)
          ),
          eq(objFieldsTable.appId, batch[0].appId)
        )
      )
      .limit(batchSize);
    const existingFieldsMap = new Map<string, IObjField>(
      existingFields.map((field) => [field.field, field])
    );
    const newFields: IObjField[] = [];
    const existingFieldsToUpdate: Array<{
      id: string;
      obj: Partial<IObjField>;
    }> = [];
    batch.forEach((field) => {
      const existingField = existingFieldsMap.get(field.field);
      if (existingField) {
        existingFieldsToUpdate.push({
          id: existingField.id,
          obj: {
            valueTypes: Array.from(
              new Set([...existingField.valueTypes, ...field.valueTypes])
            ),
            updatedAt: field.updatedAt,
          },
        });
      } else {
        newFields.push({
          id: uuidv7(),
          appId: field.appId,
          tag: field.tag,
          groupId: field.groupId,
          createdAt: field.createdAt,
          updatedAt: field.updatedAt,
          field: field.field,
          fieldKeys: field.fieldKeys as string[],
          fieldKeyTypes: field.fieldKeyTypes,
          valueTypes: Array.from(field.valueTypes),
        });
      }
    });

    // @ts-expect-error
    const batchParams: Parameters<typeof db.batch> = [];

    if (newFields.length > 0) {
      // @ts-expect-error
      batchParams.push(db.insert(objFieldsTable).values(newFields));
    }
    if (existingFieldsToUpdate.length > 0) {
      batchParams.push(
        // @ts-expect-error
        ...existingFieldsToUpdate.map(({ id, obj }) =>
          db.update(objFieldsTable).set(obj).where(eq(objFieldsTable.id, id))
        )
      );
    }

    if (batchParams.length > 0) {
      // @ts-expect-error
      await db.batch(batchParams);
    }
    batchIndex += batchSize;
  }
}

function getValueType(value: unknown) {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  return typeof value;
}

async function indexObjParts(params: {
  objs: IObj[];
  indexList: ReturnType<typeof indexJson>[];
}) {
  const { objs, indexList } = params;

  const parts: IObjPart[] = [];

  indexList.forEach((index, objIndex) => {
    const obj = objs[objIndex];
    forEach(index, (value, stringKey) => {
      value.value.forEach((partValue) => {
        const type = getValueType(partValue);
        const part: IObjPart = {
          id: uuidv7(),
          objId: obj.id,
          field: stringKey,
          value: String(partValue),
          valueBoolean: type === "boolean" ? Boolean(partValue) : undefined,
          valueNumber: type === "number" ? Number(partValue) : undefined,
          type,
          appId: obj.appId,
          groupId: obj.groupId,
          createdAt: obj.createdAt,
          updatedAt: obj.updatedAt,
          tag: obj.tag,
        };

        parts.push(part);
      });
    });
  });

  let batchSize = 100;
  let batchIndex = 0;
  while (batchIndex < parts.length) {
    const batch = parts.slice(batchIndex, batchIndex + batchSize);
    const existingParts = await db
      .select()
      .from(objPartsTable)
      .where(
        and(
          inArray(
            objPartsTable.objId,
            batch.map((part) => part.objId)
          ),
          inArray(
            objPartsTable.field,
            batch.map((part) => part.field)
          ),
          eq(objPartsTable.appId, batch[0].appId)
        )
      );
    const existingPartsMap = new Map<string, IObjPart>(
      existingParts.map((part) => [`${part.objId}-${part.field}`, part])
    );
    const newParts: IObjPart[] = [];
    const existingPartsToUpdate: Array<{
      id: string;
      obj: Partial<IObjPart>;
    }> = [];
    batch.forEach((part) => {
      const existingPart = existingPartsMap.get(`${part.objId}-${part.field}`);
      if (existingPart) {
        existingPartsToUpdate.push({
          id: existingPart.id as string,
          obj: {
            value: part.value,
            valueBoolean: part.valueBoolean,
            valueNumber: part.valueNumber,
            type: part.type,
            updatedAt: part.updatedAt,
          },
        });
      } else {
        newParts.push(part);
      }
    });

    // @ts-expect-error
    const batchParams: Parameters<typeof db.batch> = [];

    if (newParts.length > 0) {
      // @ts-expect-error
      batchParams.push(db.insert(objPartsTable).values(newParts));
    }
    if (existingPartsToUpdate.length > 0) {
      batchParams.push(
        // @ts-expect-error
        ...existingPartsToUpdate.map(({ id, obj }) =>
          db.update(objPartsTable).set(obj).where(eq(objPartsTable.id, id))
        )
      );
    }

    if (batchParams.length > 0) {
      // @ts-expect-error
      await db.batch(batchParams);
    }
    batchIndex += batchSize;
  }
}

function initAppGetter() {
  const cache = new LRUCache<string, IApp>({
    max: batchSize * 2,
  });

  const prefetchApps = async (objs: IObj[]) => {
    const appIds = uniq(objs.map((obj) => obj.appId));
    const apps: Record<string, IApp | null> = {};
    appIds.forEach((appId) => {
      apps[appId] = cache.get(appId) ?? null;
    });
    const appsToFetch = appIds.filter((appId) => !apps[appId]);
    const fetchedApps = await getApps({
      args: {
        query: {
          id: {
            in: appsToFetch,
          },
        },
      },
    });

    fetchedApps.apps.forEach((app) => {
      cache.set(app.id, app);
    });
  };

  const getApp = (obj: IObj) => {
    const app = cache.get(obj.appId);
    return app ?? null;
  };

  return {
    getApp,
    prefetchApps,
  };
}

async function indexObjsBatch(params: {
  objs: IObj[];
  getApp: (obj: IObj) => IApp | null;
}) {
  const { objs, getApp } = params;

  // TODO: eventually move to or make a background job service to avoid
  // blocking the server
  const indexList = objs.map((obj) => {
    const app = getApp(obj);
    const fieldsToIndex = obj.fieldsToIndex ?? app?.objFieldsToIndex ?? null;

    const rawIndex = indexJson(obj.objRecord, { flattenNumericKeys: true });

    let index: ReturnType<typeof indexJson> = rawIndex;
    if (fieldsToIndex) {
      index = {};
      fieldsToIndex.reduce((acc, field) => {
        if (rawIndex[field]) {
          acc[field] = rawIndex[field];
        }
        return acc;
      }, index);
    }

    return index;
  });

  await indexObjFields({ objs, indexList });
  await indexObjParts({ objs, indexList });
}

export async function indexObjs(params: {
  lastSuccessAt: Date | null;
  storage?: IObjStorage;
  storageType?: "mongo" | "postgres";
}) {
  const {
    lastSuccessAt,
    storageType = getDefaultStorageType(),
    storage = createStorage({ type: storageType }),
  } = params;

  const { getApp, prefetchApps } = initAppGetter();

  let page = 0;
  let batch: IObj[] = [];

  do {
    const cutoffDate = lastSuccessAt ?? new Date("1970-01-01T00:00:00.000Z");

    const readResult = await storage.read({
      query: {
        metaQuery: {
          updatedAt: {
            gte: cutoffDate.getTime(),
          },
        },
        topLevelFields: {
          shouldIndex: true,
        },
      },
      // tag is optional - not provided means no tag filtering
      page,
      limit: batchSize,
    });

    batch = readResult.objs;

    await prefetchApps(batch);

    const batchGroupedByApp = groupBy(batch, (obj) => obj.appId);

    await Promise.all(
      Object.values(batchGroupedByApp).map((batch) =>
        indexObjsBatch({ objs: batch, getApp })
      )
    );

    page++;
  } while (batch.length > 0);
}
