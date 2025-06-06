import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "../../common/error.js";
import type {
  AddAppEndpointArgs,
  IAppObjRecord,
} from "../../definitions/app.js";
import { kObjTags } from "../../definitions/obj.js";
import { kId0 } from "../../definitions/system.js";
import { setManyObjs } from "../obj/setObjs.js";
import { objToApp } from "./objToApp.js";

export async function addApp(params: {
  args: AddAppEndpointArgs;
  by: string;
  byType: string;
}) {
  const { args, by, byType } = params;
  const { name, description, groupId, objFieldsToIndex } = args;
  const objRecord: IAppObjRecord = {
    name,
    description,
    groupId,
    objFieldsToIndex: objFieldsToIndex
      ? Array.from(new Set(objFieldsToIndex))
      : null,
  };

  const { failedItems, newObjs } = await setManyObjs({
    by,
    byType,
    groupId,
    tag: kObjTags.app,
    input: {
      appId: kId0,
      items: [objRecord],
      conflictOnKeys: ["name"],
      onConflict: "fail",
    },
  });

  assert(
    failedItems.length === 0,
    new OwnServerError(
      "Failed to add app",
      kOwnServerErrorCodes.InternalServerError
    )
  );
  assert(
    newObjs.length === 1,
    new OwnServerError(
      "Failed to add app",
      kOwnServerErrorCodes.InternalServerError
    )
  );

  const app = objToApp(newObjs[0]);
  return { app };
}
