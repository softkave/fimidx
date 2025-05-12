import { Duration } from "date-fns";
import { ValueOf } from "type-fest";
import { z } from "zod";
import { LogPartFilterList, logPartFilterListSchema } from "./log";
import { durationSchema } from "./other";

export const kMonitorStatus = {
  enabled: "enabled",
  disabled: "disabled",
} as const;

export type MonitorStatus = ValueOf<typeof kMonitorStatus>;

export interface IMonitorReportsTo {
  userId: string;
  addedAt: Date;
  addedBy: string;
}

export interface IMonitor {
  id: string;
  name: string;
  nameLower: string;
  description?: string | null;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  orgId: string;
  appId: string;
  filters: LogPartFilterList;
  lastRun: Date | null;
  nextRun: Date | null;
  status: MonitorStatus;
  statusUpdatedAt: Date;
  reportsTo: IMonitorReportsTo[];
  duration: Duration;
}

export const createMonitorSchema = z.object({
  appId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  filters: logPartFilterListSchema,
  status: z.nativeEnum(kMonitorStatus),
  reportsTo: z.array(z.string().min(1)),
  duration: durationSchema,
});

export const updateMonitorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  filters: logPartFilterListSchema.optional(),
  status: z.nativeEnum(kMonitorStatus).optional(),
  reportsTo: z.array(z.string().min(1)).optional(),
  duration: durationSchema.optional(),
});

export const getMonitorByIdSchema = z.object({
  id: z.string().min(1),
});

export const getMonitorsSchema = z.object({
  appId: z.string(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).optional(),
});

export const deleteMonitorSchema = z.object({
  id: z.string().optional(),
  appId: z.string().optional(),
  acknowledgeDeleteAllInApp: z.boolean().optional(),
});

export type CreateMonitorEndpointArgs = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorEndpointArgs = z.infer<typeof updateMonitorSchema>;
export type GetMonitorByIdEndpointArgs = z.infer<typeof getMonitorByIdSchema>;
export type GetMonitorsEndpointArgs = z.infer<typeof getMonitorsSchema>;
export type DeleteMonitorEndpointArgs = z.infer<typeof deleteMonitorSchema>;

export interface IGetMonitorsEndpointResponse {
  monitors: IMonitor[];
  total: number;
}

export interface IGetMonitorByIdEndpointResponse {
  monitor: IMonitor;
}

export interface ICreateMonitorEndpointResponse {
  monitor: IMonitor;
}

export interface IUpdateMonitorEndpointResponse {
  monitor: IMonitor;
}

export const kMonitorStatusLabels = {
  [kMonitorStatus.enabled]: "Enabled",
  [kMonitorStatus.disabled]: "Disabled",
} as const;
