import { and, eq, inArray } from "drizzle-orm";
import { forEach, groupBy, uniq } from "lodash-es";
import { LRUCache } from "lru-cache";
import { v7 as uuidv7 } from "uuid";
import {
  indexJson,
  type FieldType,
  type IndexedJson,
} from "../../common/indexer.js";
import { db, objFields as objFieldsTable } from "../../db/fmdx.sqlite.js";
import type { IApp } from "../../definitions/app.js";
import type { IObj, IObjField } from "../../definitions/obj.js";
import { createStorage, getDefaultStorageType } from "../../storage/config.js";
import type { IObjStorage } from "../../storage/types.js";
import { getApps } from "../app/getApps.js";

const batchSize = 1000;

async function indexObjFields(params: {
  objs: IObj[];
  indexList: IndexedJson[];
}) {
  const { objs, indexList } = params;

  const fieldsSet = new Map<string, IObjField>();

  indexList.forEach((index, objIndex) => {
    const obj = objs[objIndex];
    forEach(index, (indexedField, fieldPath) => {
      let field: IObjField | undefined = fieldsSet.get(fieldPath);

      if (!field) {
        field = {
          id: uuidv7(),
          path: fieldPath,
          type: indexedField.type,
          arrayTypes: indexedField.arrayTypes
            ? Array.from(indexedField.arrayTypes)
            : [],
          isArrayCompressed: indexedField.isArrayCompressed,
          appId: obj.appId,
          groupId: obj.groupId,
          tag: obj.tag,
          createdAt: obj.createdAt,
          updatedAt: obj.updatedAt,
        };
        fieldsSet.set(fieldPath, field);
      } else {
        // Merge array types if this field already exists
        if (indexedField.arrayTypes) {
          const existingArrayTypes = new Set(field.arrayTypes);
          indexedField.arrayTypes.forEach((type) =>
            existingArrayTypes.add(type)
          );
          field.arrayTypes = Array.from(existingArrayTypes);
        }
        field.updatedAt = obj.updatedAt;
      }
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
            objFieldsTable.path,
            batch.map((field) => field.path)
          ),
          eq(objFieldsTable.appId, batch[0].appId)
        )
      )
      .limit(batchSize);
    const existingFieldsMap = new Map<string, IObjField>(
      existingFields.map((field) => [
        field.path,
        {
          ...field,
          type: field.type as FieldType,
        },
      ])
    );
    const newFields: IObjField[] = [];
    const existingFieldsToUpdate: Array<{
      id: string;
      obj: Partial<IObjField>;
    }> = [];
    batch.forEach((field) => {
      const existingField = existingFieldsMap.get(field.path);
      if (existingField) {
        existingFieldsToUpdate.push({
          id: existingField.id,
          obj: {
            arrayTypes: field.arrayTypes,
            updatedAt: field.updatedAt,
          },
        });
      } else {
        newFields.push(field);
      }
    });

    console.log("New fields", newFields);
    console.log("Existing fields to update", existingFieldsToUpdate);

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

    if (appsToFetch.length === 0) {
      return;
    }

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

export async function indexObjsBatch(params: {
  objs: IObj[];
  getApp: (obj: IObj) => IApp | null;
}) {
  const { objs, getApp } = params;

  // TODO: eventually move to or make a background job service to avoid
  // blocking the server
  const indexList = objs.map((obj) => {
    const app = getApp(obj);
    const fieldsToIndex = obj.fieldsToIndex ?? app?.objFieldsToIndex ?? null;
    const rawIndex = indexJson(obj.objRecord);
    let index: IndexedJson = rawIndex;
    if (fieldsToIndex) {
      index = {};
      fieldsToIndex.forEach((field) => {
        if (rawIndex[field]) {
          index[field] = rawIndex[field];
        }
      });
    }

    return index;
  });

  console.log("Index list", indexList);

  await indexObjFields({ objs, indexList });
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

    console.log("Read result", readResult);

    batch = readResult.objs;
    await prefetchApps(batch);
    const batchGroupedByApp = groupBy(batch, (obj) => obj.appId);

    // index one batch at a time to avoid duplicating fields across batches
    await Object.values(batchGroupedByApp).reduce(async (acc, batch) => {
      await acc;
      return indexObjsBatch({ objs: batch, getApp });
    }, Promise.resolve());

    page++;
  } while (batch.length > 0);
}
