import { z } from "zod";
import {
  inputObjRecordArraySchema,
  objPartLogicalQuerySchema,
  objSortListSchema,
  stringMetaQuerySchema,
  type IObj,
  type IObjField,
} from "./obj.js";

export type ILog = IObj;

export const ingestLogsSchema = z.object({
  appId: z.string(),
  logs: inputObjRecordArraySchema,
});

export const logsMetaQuerySchema = z.object({
  id: stringMetaQuerySchema.optional(),
  createdBy: stringMetaQuerySchema.optional(),
  updatedBy: stringMetaQuerySchema.optional(),
});

export const logQuerySchema = z.object({
  appId: z.string(),
  logsQuery: objPartLogicalQuerySchema.optional(),
  metaQuery: logsMetaQuerySchema.optional(),
});

export const getLogsSchema = z.object({
  query: logQuerySchema,
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
