import { kEmailRecordStatus } from "fmdx-core/definitions/email";
import {
  addMemberSchema,
  IAddMemberEndpointResponse,
} from "fmdx-core/definitions/members";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  addMember,
  augmentMembers,
  checkPermission,
  hasPermission,
  updateMemberSendEmailStatus,
} from "fmdx-core/serverHelpers/index";
import { sendAddParticipantEmail } from "../../serverHelpers/emails/sendAddParticipantEmail";
import { NextUserAuthenticatedEndpointFn } from "../types";

async function sendEmailAndUpdateMember(params: {
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
      id,
      sentEmailCount: 1,
      emailLastSentAt: new Date(),
      emailLastSentStatus: kEmailRecordStatus.sent,
    });
  } catch (error) {
    console.error(error);
  }
}

export const addMemberEndpoint: NextUserAuthenticatedEndpointFn<
  IAddMemberEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId, user, email },
  } = params;
  const input = addMemberSchema.parse(await req.json());

  await checkPermission({
    userId,
    orgId: input.orgId,
    permission: kPermissions.member.invite,
  });

  const member = await addMember({
    args: input,
    inviterId: userId,
    orgId: input.orgId,
  });

  await sendEmailAndUpdateMember({
    to: member.email,
    orgName: input.orgId,
    inviterName: user?.name ?? email,
    callerId: member.id,
    id: member.id,
  });

  const augmentedMember = await augmentMembers(
    [member],
    await hasPermission({
      userId,
      orgId: input.orgId,
      permission: kPermissions.member.readPermissions,
    })
  );

  const response: IAddMemberEndpointResponse = {
    member: augmentedMember[0],
  };

  return response;
};
