import { z } from "zod";
import {
  inputObjRecordArraySchema,
  objPartLogicalQuerySchema,
  objSortListSchema,
  type IObj,
  type IObjField,
} from "./obj.js";

export type ILog = IObj;

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

export const getLogFieldValuesSchema = z.object({
  appId: z.string(),
  field: z.string(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type IngestLogsEndpointArgs = z.infer<typeof ingestLogsSchema>;
export type GetLogsEndpointArgs = z.infer<typeof getLogsSchema>;
export type GetLogFieldsEndpointArgs = z.infer<typeof getLogFieldsSchema>;
export type GetLogFieldValuesEndpointArgs = z.infer<
  typeof getLogFieldValuesSchema
>;

export interface GetLogsEndpointResponse {
  logs: ILog[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface GetLogFieldsEndpointResponse {
  fields: IObjField[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface GetLogFieldValuesEndpointResponse {
  values: { value: string; type: string }[];
  page: number;
  limit: number;
  hasMore: boolean;
}
