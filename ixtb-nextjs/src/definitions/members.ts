import { ValueOf } from "type-fest";
import { z } from "zod";
import { EmailRecordStatus } from "./email";

export const kMemberStatus = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
  unknown: "unknown",
} as const;

export type MemberStatus = ValueOf<typeof kMemberStatus>;

export interface IMember {
  id: string;
  createdAt: number | Date;
  createdBy: string;
  updatedAt: number | Date;
  updatedBy: string;
  email: string;
  userId?: string | null;
  /** Permissions are null if reading other members and user does not have
   * member:readPermissions permission. */
  permissions: string[] | null;
  orgId: string;
  status: MemberStatus;
  statusUpdatedAt: number | Date;
  /** Number of emails sent to the member */
  sentEmailCount: number;
  /** Last email sent to the member */
  emailLastSentAt: number | Date | null;
  /** Status of the last email sent to the member */
  emailLastSentStatus: EmailRecordStatus | (string & {}) | null;
}

export interface IMemberRequest {
  requestId: string;
  orgId: string;
  orgName: string;
  status: MemberStatus;
  createdAt: number | Date;
}

export interface IFetchedMember extends IMember {
  name: string | null;
}

export const addMemberSchema = z.object({
  email: z.string().email(),
  permissions: z.array(z.string()),
});

export const getMemberByUserIdSchema = z.object({
  userId: z.string().min(1),
});

export const getMemberByIdSchema = z.object({
  id: z.string().min(1),
});

export const updateMemberSchema = z.object({
  permissions: z.array(z.string()).optional(),
});

export const removeMemberSchema = z.object({
  id: z.string().min(1),
});

export const respondToMemberRequestSchema = z.object({
  status: z.enum([kMemberStatus.accepted, kMemberStatus.rejected]),
});

export const getMembersSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).optional(),
});

export const getUserRequestsSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).optional(),
});

export type AddMemberEndpointArgs = z.infer<typeof addMemberSchema>;
export type GetMembersEndpointArgs = z.infer<typeof getMembersSchema>;
export type GetMemberByIdEndpointArgs = z.infer<typeof getMemberByUserIdSchema>;
export type UpdateMemberEndpointArgs = z.infer<typeof updateMemberSchema>;
export type RemoveMemberEndpointArgs = z.infer<typeof removeMemberSchema>;
export type RespondToMemberRequestEndpointArgs = z.infer<
  typeof respondToMemberRequestSchema
>;
export type GetUserRequestsEndpointArgs = z.infer<typeof getUserRequestsSchema>;

export interface IGetMembersEndpointResponse {
  members: IFetchedMember[];
  total: number;
}

export interface IGetMemberEndpointResponse {
  member: IFetchedMember;
}

export interface IGetUserMemberRequestsEndpointResponse {
  requests: IMemberRequest[];
  total: number;
}

export interface IAddMemberEndpointResponse {
  member: IFetchedMember;
}

export interface IUpdateMemberEndpointResponse {
  member: IFetchedMember;
}

export interface IRespondToMemberRequestEndpointResponse {
  member: IMemberRequest;
}

export const kMemberStatusLabels: Record<MemberStatus, string> = {
  [kMemberStatus.pending]: "Pending",
  [kMemberStatus.accepted]: "Member",
  [kMemberStatus.rejected]: "Rejected",
  [kMemberStatus.unknown]: "Unknown",
};
