import type { GetLogFieldsEndpointArgs } from "../../definitions/log.js";
import { kObjTags } from "../../definitions/obj.js";
import { getObjFields } from "../obj/getObjFields.js";

export async function getLogFields(params: GetLogFieldsEndpointArgs) {
  const { fields, page, limit, hasMore } = await getObjFields({
    ...params,
    tag: kObjTags.log,
  });

  return {
    fields,
    page,
    limit,
    hasMore,
  };
}
