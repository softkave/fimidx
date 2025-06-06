import { inArray } from "drizzle-orm";
import type { FilterQuery } from "mongoose";
import { db, objParts as objPartsTable } from "../../db/fmdx-schema.js";
import { objModel } from "../../db/mongo.js";
import type { IObj, IObjQuery } from "../../definitions/obj.js";
import { getObjQueryFilter } from "./getObjs.js";

export async function deleteManyObjs(params: {
  objQuery: IObjQuery;
  tag: string;
  date?: Date;
  deletedBy: string;
  deletedByType: string;
  deleteMany?: boolean;
}) {
  const {
    objQuery,
    tag,
    date = new Date(),
    deletedBy,
    deletedByType,
    deleteMany = false,
  } = params;
  const filter = getObjQueryFilter({ objQuery, date, tag });

  if (deleteMany) {
    await objModel.updateMany(filter, {
      $set: {
        deletedAt: date,
        deletedBy,
        deletedByType,
      },
    });
  } else {
    await objModel.updateOne(filter, {
      $set: {
        deletedAt: date,
        deletedBy,
        deletedByType,
      },
    });
  }
}

export async function cleanupDeletedObjs() {
  const filter: FilterQuery<IObj> = {
    deletedAt: { $ne: null },
  };

  let batch: IObj[] = [];
  let page = 0;
  const batchSize = 1000;
  do {
    batch = await objModel
      .find(filter)
      .skip(page * batchSize)
      .limit(batchSize)
      .exec();
    if (batch.length > 0) {
      // TODO: delete objFields

      const objIds = batch.map((obj) => obj.id);
      await db
        .delete(objPartsTable)
        .where(inArray(objPartsTable.objId, objIds));
      await objModel.deleteMany({ id: { $in: objIds } });
    }
  } while (batch.length > 0);
}
