import { get } from "lodash-es";
import { v7 as uuidv7 } from "uuid";
import { objModel } from "../../db/mongo.js";
import type {
  IInputObjRecord,
  IObj,
  IObjQuery,
  ISetManyObjsEndpointArgs,
  ISetManyObjsEndpointResponse,
} from "../../definitions/obj.js";
import { getManyObjs } from "./getObjs.js";
import { getUpdateObj } from "./updateObjs.js";

function getObjPartQueryFromItemAndConflictOnKeys(params: {
  item: IInputObjRecord;
  conflictOnKeys: string[];
  appId: string;
}) {
  const { item, conflictOnKeys, appId } = params;
  const objPartQuery: IObjQuery = {
    appId,
    partQuery: {
      and: [],
    },
  };

  conflictOnKeys.forEach((key) => {
    const value = get(item, key);
    if (value !== undefined) {
      objPartQuery.partQuery!.and!.push({
        field: key,
        op: "eq",
        value,
      });
    }
  });

  return objPartQuery.partQuery?.and?.length ? objPartQuery : undefined;
}

async function getExistingObjForItem(params: {
  item: IInputObjRecord;
  conflictOnKeys: string[];
  appId: string;
  tag: string;
  date: Date;
}) {
  const { item, conflictOnKeys, appId, tag, date } = params;
  const objPartQuery = getObjPartQueryFromItemAndConflictOnKeys({
    item,
    conflictOnKeys,
    appId,
  });

  if (!objPartQuery) {
    return undefined;
  }

  const existingObjs = await getManyObjs({
    objQuery: objPartQuery,
    tag,
    date,
  });

  return existingObjs.objs[0];
}

async function getExistingObjsForItems(params: {
  items: IInputObjRecord[];
  conflictOnKeys?: string[];
  appId: string;
  tag: string;
  date: Date;
}) {
  const { items, conflictOnKeys, appId, tag, date } = params;

  if (!conflictOnKeys?.length) {
    return [];
  }

  let batchSize = 20;
  let batchIndex = 0;
  const existingObjs: (IObj | undefined)[] = [];
  while (batchIndex < items.length) {
    const batch = items.slice(batchIndex, batchIndex + batchSize);
    const batchExistingObjs = await Promise.all(
      batch.map((item) =>
        getExistingObjForItem({ item, conflictOnKeys, appId, tag, date })
      )
    );
    existingObjs.push(...batchExistingObjs);
    batchIndex += batchSize;
  }

  return existingObjs;
}

async function groupItemsIntoNewAndExisting(params: {
  items: IInputObjRecord[];
  conflictOnKeys?: string[];
  appId: string;
  tag: string;
  date: Date;
}) {
  const { items, conflictOnKeys, appId, tag, date } = params;
  const existingObjs = await getExistingObjsForItems({
    items,
    conflictOnKeys,
    appId,
    tag,
    date,
  });
  const result: {
    newObjs: IInputObjRecord[];
    existingObjs: {
      obj: IObj;
      item: IInputObjRecord;
    }[];
  } = {
    newObjs: [],
    existingObjs: [],
  };

  items.forEach((item, index) => {
    const existingObj = existingObjs[index];
    if (existingObj) {
      result.existingObjs.push({ obj: existingObj, item });
    } else {
      result.newObjs.push(item);
    }
  });

  return result;
}

async function addManyObjs(params: {
  newObjs: IInputObjRecord[];
  appId: string;
  tag: string;
  date: Date;
  groupId: string;
  createdBy: string;
  createdByType: string;
  shouldIndex: boolean;
  fieldsToIndex: string[] | null;
}) {
  const {
    newObjs,
    appId,
    tag,
    date,
    groupId,
    createdBy,
    createdByType,
    shouldIndex,
    fieldsToIndex,
  } = params;
  const newObjsWithId = newObjs.map(
    (item): IObj => ({
      id: uuidv7(),
      appId,
      tag,
      groupId,
      createdAt: date,
      createdBy,
      createdByType,
      updatedAt: date,
      updatedBy: createdBy,
      updatedByType: createdByType,
      objRecord: item,
      deletedAt: null,
      deletedBy: null,
      deletedByType: null,
      shouldIndex,
      fieldsToIndex,
    })
  );

  await objModel.insertMany(newObjsWithId);
  return newObjsWithId;
}

async function updateManyObjs(params: {
  objsToUpdate: {
    id: string;
    obj: IObj;
  }[];
}) {
  const { objsToUpdate } = params;

  if (objsToUpdate.length === 0) {
    return;
  }

  await objModel.bulkWrite(
    objsToUpdate.map(({ id, obj }) => ({
      updateOne: {
        filter: { id },
        update: {
          $set: {
            updatedAt: obj.updatedAt,
            updatedBy: obj.updatedBy,
            updatedByType: obj.updatedByType,
            objRecord: obj.objRecord,
          },
        },
      },
    }))
  );
}

export async function setManyObjs(params: {
  tag: string;
  input: ISetManyObjsEndpointArgs;
  by: string;
  byType: string;
  groupId: string;
}) {
  const { tag, input, by, byType, groupId } = params;
  const date = new Date();
  const { newObjs, existingObjs } = await groupItemsIntoNewAndExisting({
    items: input.items,
    conflictOnKeys: input.conflictOnKeys,
    appId: input.appId,
    tag,
    date,
  });

  const objsToUpdate =
    input.onConflict === "ignore" || input.onConflict === "fail"
      ? []
      : existingObjs.map(({ obj, item }) => {
          return getUpdateObj({
            obj,
            date,
            by,
            byType,
            updateWay: input.onConflict ?? "replace",
            item,
          });
        });

  const [addedObjs] = await Promise.all([
    addManyObjs({
      newObjs,
      appId: input.appId,
      tag,
      date,
      groupId,
      createdBy: by,
      createdByType: byType,
      shouldIndex: input.shouldIndex ?? true,
      fieldsToIndex: input.fieldsToIndex
        ? Array.from(new Set(input.fieldsToIndex))
        : null,
    }),
    updateManyObjs({
      objsToUpdate,
    }),
  ]);

  const ignoredItems =
    input.onConflict === "ignore" ? existingObjs.map(({ item }) => item) : [];
  const failedItems =
    input.onConflict === "fail" ? existingObjs.map(({ item }) => item) : [];

  const response: ISetManyObjsEndpointResponse = {
    newObjs: addedObjs,
    updatedObjs: objsToUpdate.map(({ obj }) => obj),
    ignoredItems,
    failedItems,
  };

  return response;
}
