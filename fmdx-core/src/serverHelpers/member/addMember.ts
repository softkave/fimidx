import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "../../common/error.js";
import {
  kMemberStatus,
  type AddMemberEndpointArgs,
  type IMemberObjRecord,
} from "../../definitions/member.js";
import { kObjTags } from "../../definitions/obj.js";
import { setManyObjs } from "../obj/setObjs.js";
import { objToMember } from "./objToMember.js";

export async function addMember(params: {
  args: AddMemberEndpointArgs;
  by: string;
  byType: string;
  memberId: string;
  seed?: Partial<IMemberObjRecord>;
}) {
  const { args, by, byType, seed } = params;
  const {
    name,
    description,
    appId,
    meta,
    permissions,
    groupId,
    email,
    memberId,
  } = args;
  const objRecord: IMemberObjRecord = {
    name,
    description,
    meta,
    permissions,
    status: seed?.status ?? kMemberStatus.pending,
    statusUpdatedAt: seed?.statusUpdatedAt ?? new Date(),
    sentEmailCount: seed?.sentEmailCount ?? 0,
    emailLastSentAt: seed?.emailLastSentAt ?? null,
    emailLastSentStatus: seed?.emailLastSentStatus ?? null,
    email,
    memberId,
  };

  const { failedItems, newObjs } = await setManyObjs({
    by,
    byType,
    groupId,
    tag: kObjTags.member,
    input: {
      appId,
      items: [objRecord],
      conflictOnKeys: ["memberId", "email"],
      onConflict: "fail",
    },
  });

  assert(
    failedItems.length === 0,
    new OwnServerError(
      "Failed to add member",
      kOwnServerErrorCodes.InternalServerError
    )
  );
  assert(
    newObjs.length === 1,
    new OwnServerError(
      "Failed to add member",
      kOwnServerErrorCodes.InternalServerError
    )
  );

  const member = objToMember(newObjs[0]);
  return { member };
}
