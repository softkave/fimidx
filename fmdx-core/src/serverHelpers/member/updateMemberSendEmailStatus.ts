import type { EmailRecordStatus } from "../../definitions/email.js";
import type { IMemberObjRecord } from "../../definitions/member.js";
import { kObjTags } from "../../definitions/obj.js";
import { kId0 } from "../../definitions/system.js";
import { updateManyObjs } from "../obj/updateObjs.js";

export async function updateMemberSendEmailStatus(params: {
  appId: string;
  groupId: string;
  id: string;
  sentEmailCount: number;
  emailLastSentAt: Date;
  emailLastSentStatus: EmailRecordStatus;
}) {
  const {
    appId,
    groupId,
    id,
    sentEmailCount,
    emailLastSentAt,
    emailLastSentStatus,
  } = params;
  const update: Partial<IMemberObjRecord> = {
    sentEmailCount,
    emailLastSentAt,
    emailLastSentStatus,
  };

  await updateManyObjs({
    objQuery: {
      appId,
      partQuery: {
        and: [
          { value: id, op: "eq", field: "memberId" },
          { value: groupId, op: "eq", field: "groupId" },
        ],
      },
    },
    tag: kObjTags.member,
    update,
    updateWay: "merge",
    by: kId0,
    byType: kId0,
  });
}
