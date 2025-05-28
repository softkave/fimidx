import { merge } from "lodash-es";
import { mergeObjects, type AnyObject } from "softkave-js-utils";
import { objModel } from "../../db/mongo.js";
import type {
  IInputObjRecord,
  IObj,
  IObjQuery,
  OnConflict,
} from "../../definitions/obj.js";
import { getObjQueryFilter } from "./getObj.js";

export function getUpdateObj(params: {
  obj: IObj;
  item: IInputObjRecord;
  date: Date;
  by: string;
  byType: string;
  updateWay: OnConflict;
}) {
  const { obj, date, by, byType, updateWay, item } = params;
  return {
    id: obj.id,
    obj: {
      ...obj,
      updatedAt: date,
      updatedBy: by,
      updatedByType: byType,
      objRecord:
        updateWay === "set"
          ? item
          : updateWay === "merge"
          ? merge(obj.objRecord, item)
          : updateWay === "mergeButReplaceArrays"
          ? mergeObjects(obj.objRecord, item, {
              arrayUpdateStrategy: "replace",
            })
          : updateWay === "mergeButConcatArrays"
          ? mergeObjects(obj.objRecord, item, {
              arrayUpdateStrategy: "concat",
            })
          : updateWay === "mergeButKeepArrays"
          ? mergeObjects(obj.objRecord, item, {
              arrayUpdateStrategy: "retain",
            })
          : obj.objRecord,
    },
  };
}

export async function updateManyObjs(params: {
  objQuery: IObjQuery;
  tag: string;
  update: AnyObject;
  by: string;
  byType: string;
  updateWay: OnConflict;
  count: number;
}) {
  const { objQuery, tag, update, count, by, byType, updateWay } = params;
  const date = new Date();
  const filter = getObjQueryFilter({ objQuery, date, tag });

  let isDone = false;
  let page = 0;
  while (!isDone) {
    const objs = await objModel
      .find(filter)
      .skip(page * count)
      .limit(count);
    const objsToUpdate = objs.map((obj) => {
      return {
        id: obj.id,
        obj: getUpdateObj({
          obj,
          date,
          by,
          byType,
          updateWay,
          item: update,
        }),
      };
    });

    await objModel.bulkWrite(
      objsToUpdate.map(({ id, obj }) => ({
        updateOne: {
          filter: { id },
          update: { $set: obj },
        },
      }))
    );

    page++;
    isDone = objs.length < count;
  }
}
