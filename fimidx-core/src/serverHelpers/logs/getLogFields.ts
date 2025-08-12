import type { FieldType } from "../../common/indexer.js";
import type {
  GetLogFieldsEndpointArgs,
  GetLogFieldsEndpointResponse,
  ILogField,
} from "../../definitions/log.js";
import { kObjTags } from "../../definitions/obj.js";
import { getObjFields } from "../obj/getObjFields.js";

export async function getLogFields(params: {
  args: GetLogFieldsEndpointArgs;
}): Promise<GetLogFieldsEndpointResponse> {
  const { args } = params;
  const { appId, page, limit } = args;

  // Convert 1-based pagination to 0-based for storage layer
  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 100;
  const storagePage = pageNumber - 1; // Convert to 0-based

  const {
    fields,
    page: storagePageResult,
    limit: storageLimit,
    hasMore,
  } = await getObjFields({
    appId,
    page: storagePage,
    limit: limitNumber,
    tag: kObjTags.log,
  });

  return {
    fields: fields.map(
      (field): ILogField => ({
        appId,
        groupId: field.groupId,
        id: field.id,
        path: field.path,
        type: field.type as FieldType,
        arrayTypes: field.arrayTypes,
        isArrayCompressed: field.isArrayCompressed,
        createdAt: field.createdAt,
        updatedAt: field.updatedAt,
      })
    ),
    page: pageNumber, // Return 1-based page number
    limit: limitNumber,
    hasMore,
  };
}
