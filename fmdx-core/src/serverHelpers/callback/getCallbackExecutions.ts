import type { GetCallbackExecutionsEndpointArgs } from "../../definitions/callback.js";
import { kObjTags, type IObjQuery } from "../../definitions/obj.js";
import { getManyObjs } from "../obj/getObjs.js";
import { objToCallbackExecution } from "./objToCallbackExecution.js";

export async function getCallbackExecutions(params: {
  args: GetCallbackExecutionsEndpointArgs;
}) {
  const { args } = params;
  const { page: inputPage, limit: inputLimit, sort } = args;

  const pageNumber = inputPage ?? 1;
  const limitNumber = inputLimit ?? 100;

  const objQuery: IObjQuery = {
    appId: args.callbackId,
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
  const { objs, hasMore, page, limit } = await getManyObjs({
    objQuery,
    tag: kObjTags.callbackExecution,
    limit: limitNumber,
    page: pageNumber,
    sort: sort ? sort : undefined,
  });

  const executions = objs.map(objToCallbackExecution);
  return { executions, hasMore, page, limit };
}
