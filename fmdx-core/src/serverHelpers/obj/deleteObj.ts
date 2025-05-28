import { objModel } from "../../db/mongo.js";
import type { IObjQuery } from "../../definitions/obj.js";
import { getObjQueryFilter } from "./getObj.js";

export async function deleteManyObjs(params: {
  objQuery: IObjQuery;
  tag: string;
  date: Date;
}) {
  const { objQuery, tag, date } = params;
  const filter = getObjQueryFilter({ objQuery, date, tag });
  await objModel.deleteMany(filter);
}
