import type { Primitive } from "type-fest";
import { z } from "zod";
import {
  inputObjRecordArraySchema,
  objPartLogicalQuerySchema,
  objSortListSchema,
  type IObj,
  type IObjField,
} from "./obj.js";

export interface ILog extends IObj {
  timestamp: Date;
}

export const ingestLogsSchema = z.object({
  appId: z.string(),
  logs: inputObjRecordArraySchema,
});

export const getLogsSchema = z.object({
  appId: z.string(),
  logIds: z.array(z.string()).optional(),
  filter: objPartLogicalQuerySchema.optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: objSortListSchema.optional(),
});

export const getLogFieldsSchema = z.object({
  appId: z.string(),
  page: z.number().optional(),
  limit: z.number().optional(),
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

export type AddLogsEndpointArgs = z.infer<typeof ingestLogsSchema>;
export type GetLogsEndpointArgs = z.infer<typeof getLogsSchema>;
export type GetLogFieldsEndpointArgs = z.infer<typeof getLogFieldsSchema>;
export type GetLogByIdEndpointArgs = z.infer<typeof getLogByIdSchema>;
export type GetLogFieldValuesEndpointArgs = z.infer<
  typeof getLogFieldValuesSchema
>;

export interface GetLogByIdEndpointResponse {
  log: ILog;
}

export interface GetLogsEndpointResponse {
  logs: ILog[];
  page: number;
  limit: number;
  total: number | null;
  hasMore: boolean;
}

export interface GetLogFieldsEndpointResponse {
  fields: IObjField[];
}

export interface GetLogFieldValuesEndpointResponse {
  values: Primitive[];
  page: number;
  total: number;
}
