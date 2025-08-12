import { kEmailRecordStatus } from "fimidx-core/definitions/email";
import { kId0 } from "fimidx-core/definitions/system";
import { updateMemberSendEmailStatus } from "fimidx-core/serverHelpers/index";
import { fimidxLogger } from "../../common/logger/fimidx-logger";
import { sendAddParticipantEmail } from "../emails/sendAddParticipantEmail";

export async function sendEmailAndUpdateMember(params: {
  to: string;
  orgName: string;
  inviterName: string;
  callerId: string;
  id: string;
}) {
  const { to, orgName, inviterName, callerId, id } = params;
  try {
    await sendAddParticipantEmail({
      to,
      orgName,
      inviterName,
      callerId,
    });

    await updateMemberSendEmailStatus({
      appId: kId0,
      groupId: kId0,
      id,
      sentEmailCount: 1,
      emailLastSentAt: new Date(),
      emailLastSentStatus: kEmailRecordStatus.sent,
    });
  } catch (error) {
    fimidxLogger.error(error);
  }
}
