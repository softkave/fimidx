import {
  AddParticipantEmail,
  AddParticipantEmailProps,
  getAddParticipantEmailTitle,
} from "@/emails/add-participant";
import { kEmailRecordReason } from "fmdx-core/definitions/email";
import { sendEmail } from "./sendEmail";

export const sendAddParticipantEmail = async (params: {
  to: string;
  groupName: string;
  inviterName: string;
  callerId: string;
}) => {
  const params2: AddParticipantEmailProps = {
    groupName: params.groupName,
    inviterName: params.inviterName,
  };

  const { success, emailRecords } = await sendEmail({
    to: [params.to],
    subject: getAddParticipantEmailTitle(params2),
    react: await AddParticipantEmail(params2),
    reason: kEmailRecordReason.addParticipant,
    params: params2,
    callerId: params.callerId,
  });

  return { success, emailRecords };
};
