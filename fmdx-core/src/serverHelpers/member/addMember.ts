import assert from "assert";
import { first } from "lodash-es";
import { kOwnServerErrorCodes, OwnServerError } from "../../common/error.js";
import {
  kMemberStatus,
  type AddMemberEndpointArgs,
  type IMemberObjRecord,
} from "../../definitions/member.js";
import { kObjTags } from "../../definitions/obj.js";
import type { IPermission } from "../../definitions/permission.js";
import { setManyObjs } from "../obj/setObjs.js";
import { addMemberPermissions } from "./addMemberPermissions.js";
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

  let newPermissions: IPermission[] | null = null;
  if (permissions) {
    ({ permissions: newPermissions } = await addMemberPermissions({
      by,
      byType,
      groupId,
      appId,
      permissions,
      memberId,
    }));
  }

  const obj = first(newObjs);
  assert(
    obj,
    new OwnServerError(
      "Failed to add member",
      kOwnServerErrorCodes.InternalServerError
    )
  );

  const member = objToMember(obj, newPermissions);
  return { member };
}
