import type { GetLogFieldValuesEndpointArgs } from "../../definitions/log.js";
import { kObjTags } from "../../definitions/obj.js";
import { getObjFieldValues } from "../obj/getObjFieldValues.js";

export async function getLogFieldValues(params: {
  args: GetLogFieldValuesEndpointArgs;
}) {
  const { args } = params;
  const { appId, field, page, limit } = args;

  // Convert 1-based pagination to 0-based for storage layer
  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 100;
  const storagePage = pageNumber - 1; // Convert to 0-based

  const {
    values,
    page: storagePageResult,
    limit: storageLimit,
    hasMore,
  } = await getObjFieldValues({
    appId,
    field,
    page: storagePage,
    limit: limitNumber,
    tag: kObjTags.log,
  });

  return {
    values,
    page: pageNumber, // Return 1-based page number
    limit: limitNumber,
    hasMore,
  };
}
