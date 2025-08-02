import {
  VerificationRequestEmail,
  VerificationRequestEmailProps,
  getVerificationRequestEmailTitle,
} from "@/emails/verification-request";
import {
  kEmailRecordReason,
  kGeneralEmailCallerId,
} from "fimidx-core/definitions/email";
import { sendEmail } from "./sendEmail";

export const sendVerificationRequestEmail = async (params: {
  to: string;
  url: string;
}) => {
  const params2: VerificationRequestEmailProps = {
    url: params.url,
  };

  const { success, emailRecords } = await sendEmail({
    to: [params.to],
    subject: getVerificationRequestEmailTitle(params2),
    react: await VerificationRequestEmail(params2),
    reason: kEmailRecordReason.verificationRequest,
    params: params2,
    callerId: kGeneralEmailCallerId.verificationRequest,
  });

  return { success, emailRecords };
};
