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
  groupName: string;
  inviterName: string;
  callerId: string;
  id: string;
}) {
  const { to, groupName, inviterName, callerId, id } = params;
  try {
    await sendAddParticipantEmail({
      to,
      groupName,
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
    groupId: input.groupId,
    permission: kPermissions.member.invite,
  });

  const member = await addMember({
    args: input,
    inviterId: userId,
    groupId: input.groupId,
  });

  await sendEmailAndUpdateMember({
    to: member.email,
    groupName: input.groupId,
    inviterName: user?.name ?? email,
    callerId: member.id,
    id: member.id,
  });

  const augmentedMember = await augmentMembers(
    [member],
    await hasPermission({
      userId,
      groupId: input.groupId,
      permission: kPermissions.member.readPermissions,
    })
  );

  const response: IAddMemberEndpointResponse = {
    member: augmentedMember[0],
  };

  return response;
};
