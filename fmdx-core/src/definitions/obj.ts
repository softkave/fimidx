import type { AnyObject } from "softkave-js-utils";
import { z } from "zod";
import { durationSchema } from "./other.js";

export const kObjTags = {
  obj: "obj",
  log: "log",
  callback: "callback",
  callbackExecution: "callbackExecution",
  group: "group",
  clientToken: "clientToken",
  member: "member",
  app: "app",
  monitor: "monitor",
  permission: "permission",
} as const;

export interface IObjPart {
  id: string;
  objId: string;
  field: string;
  /** string value */
  value: string;
  /** number value */
  valueNumber?: number | null;
  /** boolean value */
  valueBoolean?: boolean | null;
  type: string;
  appId: string;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
  tag: string;
}

export type IObjField = {
  id: string;
  /** dot separated list of keys */
  field: string;
  // fieldKeys: Array<string | number>;
  fieldKeys: Array<string>;
  fieldKeyTypes: string[];
  valueTypes: string[];
  createdAt: Date;
  updatedAt: Date;
  appId: string;
  groupId: string;
  tag: string;
};

export type IObj = {
  id: string;
  createdAt: Date;
  createdBy: string;
  createdByType: string;
  appId: string;
  groupId: string;
  updatedAt: Date;
  updatedBy: string;
  updatedByType: string;
  tag: string;
  objRecord: AnyObject;
  deletedAt: Date | null;
  deletedBy: string | null;
  deletedByType: string | null;
  shouldIndex: boolean;
  fieldsToIndex: string[] | null;
};

export const inputObjRecordSchema = z.record(z.string(), z.any());
export const inputObjRecordArraySchema = z.array(inputObjRecordSchema);
export const onConflictSchema = z
  .enum([
    "replace",
    "merge",
    "mergeButConcatArrays",
    "mergeButKeepArrays",
    "mergeButReplaceArrays",
    "ignore",
    "fail",
  ])
  .default("replace");

export const setManyObjsSchema = z.object({
  appId: z.string(),
  items: inputObjRecordArraySchema.min(1).max(100),
  onConflict: onConflictSchema.optional(),
  conflictOnKeys: z.array(z.string()).optional(),
  shouldIndex: z.boolean().optional(),
  fieldsToIndex: z.array(z.string()).optional(),
});

export const objPartQueryItemOpSchema = z.enum([
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "in",
  "not_in",
  "between",
  "exists",
]);

export const objPartQueryItemNumberValueSchema = z.union([
  z.number(),
  z.string().datetime(),
  durationSchema,
]);

export const objPartQueryItemSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("eq"),
    field: z.string(),
    value: z.union([z.string(), z.number()]),
  }),
  z.object({
    op: z.literal("neq"),
    field: z.string(),
    value: z.union([z.string(), z.number()]),
  }),
  z.object({
    op: z.literal("gt"),
    field: z.string(),
    value: objPartQueryItemNumberValueSchema,
  }),
  z.object({
    op: z.literal("gte"),
    field: z.string(),
    value: objPartQueryItemNumberValueSchema,
  }),
  z.object({
    op: z.literal("lt"),
    field: z.string(),
    value: objPartQueryItemNumberValueSchema,
  }),
  z.object({
    op: z.literal("lte"),
    field: z.string(),
    value: objPartQueryItemNumberValueSchema,
  }),
  z.object({
    op: z.literal("like"),
    field: z.string(),
    // TODO: how should we handle regex and potential DOS attacks from regex
    // that runs for too long?
    value: z.string(),
    caseSensitive: z.boolean().optional(),
  }),
  z.object({
    op: z.literal("in"),
    field: z.string(),
    value: z
      .array(z.union([z.string(), z.number()]))
      .min(1)
      .max(100),
  }),
  z.object({
    op: z.literal("not_in"),
    field: z.string(),
    value: z
      .array(z.union([z.string(), z.number()]))
      .min(1)
      .max(100),
  }),
  z.object({
    op: z.literal("between"),
    field: z.string(),
    value: z.tuple([
      objPartQueryItemNumberValueSchema,
      objPartQueryItemNumberValueSchema,
    ]),
  }),
  z.object({
    op: z.literal("exists"),
    field: z.string(),
    value: z.boolean(),
  }),
]);

export const objPartQueryListSchema = z.array(objPartQueryItemSchema);
export const objPartLogicalQuerySchema = z.object({
  and: objPartQueryListSchema.optional(),
  or: objPartQueryListSchema.optional(),
});

export const stringMetaQuerySchema = z.object({
  eq: z.string().optional(),
  neq: z.string().optional(),
  in: z.array(z.string()).optional(),
  not_in: z.array(z.string()).optional(),
});

export const numberMetaQuerySchema = z.object({
  eq: z.union([z.number(), z.string().datetime()]).optional(),
  neq: z.union([z.number(), z.string().datetime()]).optional(),
  in: z.array(z.union([z.number(), z.string().datetime()])).optional(),
  not_in: z.array(z.union([z.number(), z.string().datetime()])).optional(),
  gt: objPartQueryItemNumberValueSchema.optional(),
  gte: objPartQueryItemNumberValueSchema.optional(),
  lt: objPartQueryItemNumberValueSchema.optional(),
  lte: objPartQueryItemNumberValueSchema.optional(),
  between: z
    .tuple([
      objPartQueryItemNumberValueSchema,
      objPartQueryItemNumberValueSchema,
    ])
    .optional(),
});

export const objMetaQuerySchema = z.object({
  id: stringMetaQuerySchema.optional(),
  createdAt: numberMetaQuerySchema.optional(),
  updatedAt: numberMetaQuerySchema.optional(),
  createdBy: stringMetaQuerySchema.optional(),
  updatedBy: stringMetaQuerySchema.optional(),
});

// New schema for top-level field queries
export const topLevelFieldQuerySchema = z.object({
  shouldIndex: z.boolean().optional(),
  fieldsToIndex: z.array(z.string()).optional(),
  tag: stringMetaQuerySchema.optional(),
  groupId: stringMetaQuerySchema.optional(),
  deletedAt: z.union([z.null(), numberMetaQuerySchema]).optional(),
  deletedBy: stringMetaQuerySchema.optional(),
  deletedByType: stringMetaQuerySchema.optional(),
});

export const objQuerySchema = z.object({
  appId: z.string(),
  partQuery: objPartLogicalQuerySchema.optional(),
  metaQuery: objMetaQuerySchema.optional(),
  topLevelFields: topLevelFieldQuerySchema.optional(),
});

export const objSortSchema = z.object({
  field: z.string(),
  direction: z.enum(["asc", "desc"]),
});

export const objSortListSchema = z.array(objSortSchema);
export const updateManyObjsSchema = z.object({
  query: objQuerySchema,
  update: inputObjRecordSchema,
  updateMany: z.boolean().optional(),
  updateWay: onConflictSchema.optional(),
  fieldsToIndex: z.array(z.string()).optional(),
});

export const deleteManyObjsSchema = z.object({
  query: objQuerySchema,
  deleteMany: z.boolean().optional(),
});

export const getManyObjsSchema = z.object({
  query: objQuerySchema,
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: objSortListSchema.optional(),
});

export const getObjFieldsSchema = z.object({
  appId: z.string(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const getObjFieldValuesSchema = z.object({
  appId: z.string(),
  field: z.string(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type IInputObjRecord = z.infer<typeof inputObjRecordSchema>;
export type IInputObjRecordArray = z.infer<typeof inputObjRecordArraySchema>;
export type IObjPartQueryItemNumberValue = z.infer<
  typeof objPartQueryItemNumberValueSchema
>;
export type IObjPartQueryItem = z.infer<typeof objPartQueryItemSchema>;
export type IObjPartQueryList = z.infer<typeof objPartQueryListSchema>;
export type IObjPartLogicalQuery = z.infer<typeof objPartLogicalQuerySchema>;
export type IStringMetaQuery = z.infer<typeof stringMetaQuerySchema>;
export type INumberMetaQuery = z.infer<typeof numberMetaQuerySchema>;
export type IObjMetaQuery = z.infer<typeof objMetaQuerySchema>;
export type ITopLevelFieldQuery = z.infer<typeof topLevelFieldQuerySchema>;
export type IObjQuery = z.infer<typeof objQuerySchema>;
export type IObjSort = z.infer<typeof objSortSchema>;
export type IObjSortList = z.infer<typeof objSortListSchema>;
export type OnConflict = z.infer<typeof onConflictSchema>;

export type ISetManyObjsEndpointArgs = z.infer<typeof setManyObjsSchema>;
export type IUpdateManyObjsEndpointArgs = z.infer<typeof updateManyObjsSchema>;
export type IDeleteManyObjsEndpointArgs = z.infer<typeof deleteManyObjsSchema>;
export type IGetManyObjsEndpointArgs = z.infer<typeof getManyObjsSchema>;
export type IGetObjFieldsEndpointArgs = z.infer<typeof getObjFieldsSchema>;
export type IGetObjFieldValuesEndpointArgs = z.infer<
  typeof getObjFieldValuesSchema
>;

export interface ISetManyObjsEndpointResponse {
  newObjs: IObj[];
  updatedObjs: IObj[];
  ignoredItems: IInputObjRecord[];
  failedItems: IInputObjRecord[];
}

export interface IGetManyObjsEndpointResponse {
  objs: IObj[];
  // total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface IGetObjFieldsEndpointResponse {
  fields: IObjField[];
  // total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface IGetObjFieldValuesEndpointResponse {
  values: { value: string; type: string }[];
  // total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// NOTE: For Postgres, meta query keys (createdAt, updatedBy, etc.) are mapped
// to snake_case columns (created_at, updated_by, etc.) in SQL.
