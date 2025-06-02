import type { GetLogFieldValuesEndpointArgs } from "../../definitions/log.js";
import { kObjTags } from "../../definitions/obj.js";
import { getObjFieldValues } from "../obj/getObjFieldValues.js";

export async function getLogFieldValues(params: GetLogFieldValuesEndpointArgs) {
  const { values, page, limit, hasMore } = await getObjFieldValues({
    ...params,
    tag: kObjTags.log,
  });

  return {
    values,
    page,
    limit,
    hasMore,
  };
}
