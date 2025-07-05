import type { GetCallbackExecutionsEndpointArgs } from "../../definitions/callback.js";
import { kObjTags, type IObjQuery } from "../../definitions/obj.js";
import type { IObjStorage } from "../../storage/types.js";
import { getManyObjs } from "../obj/getObjs.js";
import { objToCallbackExecution } from "./objToCallbackExecution.js";

export async function getCallbackExecutions(params: {
  args: GetCallbackExecutionsEndpointArgs;
  appId: string;
  storage?: IObjStorage;
}) {
  const { args, appId, storage } = params;
  const { page: inputPage, limit: inputLimit, sort } = args;

  // Convert 1-based pagination to 0-based for storage layer
  const pageNumber = inputPage ?? 1;
  const limitNumber = inputLimit ?? 100;
  const storagePage = pageNumber - 1; // Convert to 0-based

  const objQuery: IObjQuery = {
    appId,
    partQuery: {
      and: [
        {
          field: "callbackId",
          value: args.callbackId,
          op: "eq",
        },
      ],
    },
  };

  const result = await getManyObjs({
    objQuery,
    page: storagePage,
    limit: limitNumber,
    tag: kObjTags.callbackExecution,
    sort: sort ? sort : undefined,
    storage,
  });

  const executions = result.objs.map(objToCallbackExecution);
  return {
    executions,
    page: pageNumber, // Return 1-based page number
    limit: limitNumber,
    hasMore: result.hasMore,
  };
}
