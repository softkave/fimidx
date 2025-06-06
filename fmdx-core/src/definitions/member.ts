import type { ValueOf } from "type-fest";
import { z } from "zod";
import type { EmailRecordStatus } from "./email.js";
import {
  numberMetaQuerySchema,
  objPartQueryListSchema,
  objSortListSchema,
  stringMetaQuerySchema,
} from "./obj.js";
import { permissionAtomSchema, type IPermissionAtom } from "./permission.js";

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
  createdByType: string;
  updatedAt: number | Date;
  updatedBy: string;
  updatedByType: string;
  email?: string | null;
  memberId: string;
  /** Permissions are null if reading other members and user does not have
   * member:readPermissions permission. */
  permissions: IPermissionAtom[] | null;
  groupId: string;
  status: MemberStatus;
  statusUpdatedAt: number | Date;
  /** Number of emails sent to the member */
  sentEmailCount: number;
  /** Last email sent to the member */
  emailLastSentAt: number | Date | null;
  /** Status of the last email sent to the member */
  emailLastSentStatus: EmailRecordStatus | (string & {}) | null;
  meta?: Record<string, string> | null;
  name?: string | null;
  appId: string;
  description?: string | null;
}

export interface IMemberObjRecord {
  email?: string | null;
  memberId: string;
  status: MemberStatus;
  statusUpdatedAt: number | Date;
  sentEmailCount: number;
  emailLastSentAt: number | Date | null;
  emailLastSentStatus: EmailRecordStatus | (string & {}) | null;
  meta?: Record<string, string> | null;
  name?: string | null;
  description?: string | null;
}

export interface IMemberRequest {
  requestId: string;
  groupName: string;
  status: MemberStatus;
  updatedAt: number | Date;
}

export const addMemberSchema = z.object({
  groupId: z.string(),
  appId: z.string(),
  email: z.string().email().optional(),
  memberId: z.string(),
  permissions: z.array(permissionAtomSchema),
  meta: z.record(z.string(), z.string()).optional(),
  name: z.string().optional(),
  description: z.string().optional(),
});

export const getMemberByMemberIdSchema = z.object({
  memberId: z.string().min(1),
  groupId: z.string(),
  appId: z.string(),
});

export const memberQuerySchema = z.object({
  id: stringMetaQuerySchema.optional(),
  email: stringMetaQuerySchema.optional(),
  memberId: stringMetaQuerySchema.optional(),
  status: stringMetaQuerySchema.optional(),
  createdAt: numberMetaQuerySchema.optional(),
  updatedAt: numberMetaQuerySchema.optional(),
  createdBy: stringMetaQuerySchema.optional(),
  updatedBy: stringMetaQuerySchema.optional(),
  meta: objPartQueryListSchema.optional(),
  name: stringMetaQuerySchema.optional(),
  groupId: z.string(),
  appId: z.string(),
});

export const updateMembersSchema = z.object({
  query: memberQuerySchema,
  update: z.object({
    email: z.string().email().optional(),
    memberId: z.string().optional(),
    meta: z.record(z.string(), z.string()).optional(),
    name: z.string().optional(),
    description: z.string().optional(),
  }),
  updateMany: z.boolean().optional(),
});

export const updateMemberPermissionsSchema = z.object({
  query: z.object({
    memberId: z.string().min(1),
    groupId: z.string(),
    appId: z.string(),
  }),
  update: z.object({
    permissions: z.array(permissionAtomSchema),
  }),
});

export const deleteMembersSchema = z.object({
  query: memberQuerySchema,
  deleteMany: z.boolean().optional(),
});

export const respondToMemberRequestSchema = z.object({
  appId: z.string(),
  groupId: z.string(),
  requestId: z.string().min(1),
  status: z.enum([kMemberStatus.accepted, kMemberStatus.rejected]),
});

export const getMembersSchema = z.object({
  query: memberQuerySchema,
  page: z.number().min(1).optional(),
  limit: z.number().min(1).optional(),
  sort: objSortListSchema.optional(),
});

export const getMemberRequestsSchema = z.object({
  query: z.object({
    memberId: z.string().min(1),
    groupId: z.string(),
    appId: z.string(),
  }),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).optional(),
});

export type AddMemberEndpointArgs = z.infer<typeof addMemberSchema>;
export type GetMembersEndpointArgs = z.infer<typeof getMembersSchema>;
export type GetMemberByMemberIdEndpointArgs = z.infer<
  typeof getMemberByMemberIdSchema
>;
export type UpdateMembersEndpointArgs = z.infer<typeof updateMembersSchema>;
export type DeleteMembersEndpointArgs = z.infer<typeof deleteMembersSchema>;
export type RespondToMemberRequestEndpointArgs = z.infer<
  typeof respondToMemberRequestSchema
>;
export type GetMemberRequestsEndpointArgs = z.infer<
  typeof getMemberRequestsSchema
>;
export type UpdateMemberPermissionsEndpointArgs = z.infer<
  typeof updateMemberPermissionsSchema
>;

export interface IGetMembersEndpointResponse {
  members: IMember[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface IGetMemberByMemberIdEndpointResponse {
  member: IMember;
}

export interface IGetMemberRequestsEndpointResponse {
  requests: IMemberRequest[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface IAddMemberEndpointResponse {
  member: IMember;
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
