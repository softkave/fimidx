import type { Primitive } from "type-fest";
import { z } from "zod";

export interface ILogPart {
  id: string;
  logId: string;
  name: string;
  /** string value */
  value: string;
  /** number value */
  valueNumber?: number | null;
  /** boolean value */
  valueBoolean?: boolean | null;
  type: string;
  appId: string;
  orgId: string;
  createdAt: Date;
}

export interface ILogField {
  id: string;
  /** dot separated list of keys */
  name: string;
  /** dot separated list of types corresponding to the name */
  nameType: string;
  createdAt: Date;
  updatedAt: Date;
  appId: string;
  /** comma separated list of encountered types */
  valueType: string;
  orgId: string;
}

export interface ILog {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByType: string;
  timestamp: Date;
  appId: string;
  orgId: string;
}

export interface IFetchedLog extends ILog {
  parts: ILogPart[];
}

export const inputLogRecordSchema = z.record(z.string(), z.any());
export const inputLogRecordArraySchema = z.array(inputLogRecordSchema);
export const addLogsSchema = z.object({
  appId: z.string(),
  logs: inputLogRecordArraySchema,
});

export const logPartFilterItemOpSchema = z.enum([
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "ilike",
  "in",
  "not_in",
  "between",
]);

export const logPartFilterItemSchema = z.object({
  name: z.string(),
  value: z.array(z.string()).min(1),
  op: logPartFilterItemOpSchema,
});

export const logPartFilterListSchema = z.array(logPartFilterItemSchema);

export const getLogsSchema = z.object({
  appId: z.string(),
  logIds: z.array(z.string()).optional(),
  filter: logPartFilterListSchema.optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const getLogFieldsSchema = z.object({
  appId: z.string(),
});

export const getLogByIdSchema = z.object({
  id: z.string(),
});

export const getLogFieldValuesSchema = z.object({
  appId: z.string(),
  fieldName: z.string(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type InputLogRecord = z.infer<typeof inputLogRecordSchema>;
export type InputLogRecordArray = z.infer<typeof inputLogRecordArraySchema>;

export type LogPartFilterItemOp = z.infer<typeof logPartFilterItemOpSchema>;
export type LogPartFilterItem = z.infer<typeof logPartFilterItemSchema>;
export type LogPartFilterList = z.infer<typeof logPartFilterListSchema>;

export type AddLogsEndpointArgs = z.infer<typeof addLogsSchema>;
export type GetLogsEndpointArgs = z.infer<typeof getLogsSchema>;
export type GetLogFieldsEndpointArgs = z.infer<typeof getLogFieldsSchema>;
export type GetLogByIdEndpointArgs = z.infer<typeof getLogByIdSchema>;
export type GetLogFieldValuesEndpointArgs = z.infer<
  typeof getLogFieldValuesSchema
>;

export interface GetLogByIdEndpointResponse {
  log: IFetchedLog;
}

export interface GetLogsEndpointResponse {
  logs: IFetchedLog[];
  page: number;
  limit: number;
  total: number | null;
  hasMore: boolean;
}

export interface GetLogFieldsEndpointResponse {
  fields: ILogField[];
}

export interface GetLogFieldValuesEndpointResponse {
  values: Primitive[];
  page: number;
  total: number;
}
