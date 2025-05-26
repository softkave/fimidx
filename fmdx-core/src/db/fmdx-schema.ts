import { createClient } from "@libsql/client";
import assert from "assert";
import type { Duration } from "date-fns";
import { drizzle } from "drizzle-orm/libsql";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 as uuidv7 } from "uuid";
import type { LogPartFilterList } from "../definitions/log.js";
import type { MemberStatus } from "../definitions/members.js";
import {
  type IMonitorReportsTo,
  type MonitorStatus,
} from "../definitions/monitor.js";

const fmdxDbURL = process.env.FMDX_DB_TURSO_DATABASE_URL;
const fmdxDbAuthToken = process.env.FMDX_DB_TURSO_AUTH_TOKEN;

assert.ok(fmdxDbURL, "FMDX_DB_TURSO_DATABASE_URL is required");
assert.ok(fmdxDbAuthToken, "FMDX_DB_TURSO_AUTH_TOKEN is required");

const fmdxClient = createClient({
  authToken: fmdxDbAuthToken,
  url: fmdxDbURL,
});

export const db = drizzle(fmdxClient);

export const emailRecords = sqliteTable("emailRecord", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull(),
  reason: text("reason").notNull(),
  params: text("params", { mode: "json" }).$type<Record<string, unknown>>(),
  provider: text("provider").notNull(),
  response: text("response"),
  senderError: text("senderError"),
  serverError: text("serverError"),
  callerId: text("callerId"),
});

export const emailBlockLists = sqliteTable("emailBlockList", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  email: text("email").notNull(),
  justifyingEmailRecordId: text("justifyingEmailRecordId").references(
    () => emailRecords.id,
    { onDelete: "cascade" }
  ),
  reason: text("reason"),
});

export const orgs = sqliteTable("org", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  name: text("name").notNull(),
  nameLower: text("nameLower").notNull(),
  description: text("description"),
  createdBy: text("createdBy").notNull(),
  updatedBy: text("updatedBy").notNull(),
});

export const apps = sqliteTable("app", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  name: text("name").notNull(),
  nameLower: text("nameLower").notNull(),
  description: text("description"),
  createdBy: text("createdBy").notNull(),
  updatedBy: text("updatedBy").notNull(),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
});

export const logFields = sqliteTable("logField", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  appId: text("appId")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  nameType: text("nameType").notNull(),
  valueType: text("valueType").notNull(),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
});

export const logs = sqliteTable("log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  appId: text("appId")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull(),
  createdBy: text("createdBy").notNull(),
  createdByType: text("createdByType").notNull(),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
});

export const logParts = sqliteTable("logPart", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  logId: text("logId")
    .references(() => logs.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  valueNumber: integer("valueNumber"),
  valueBoolean: integer("valueBoolean", { mode: "boolean" }),
  type: text("type").notNull(),
  appId: text("appId")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
});

export const clientTokens = sqliteTable("clientToken", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  name: text("name").notNull(),
  nameLower: text("nameLower").notNull(),
  description: text("description"),
  createdBy: text("createdBy").notNull(),
  updatedBy: text("updatedBy").notNull(),
  appId: text("appId")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
});

export const members = sqliteTable("member", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  email: text("email").notNull(),
  userId: text("userId"),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
  createdBy: text("createdBy").notNull(),
  updatedBy: text("updatedBy").notNull(),
  status: text("status").$type<MemberStatus>().notNull(),
  statusUpdatedAt: integer("statusUpdatedAt", {
    mode: "timestamp_ms",
  }).notNull(),
  sentEmailCount: integer("sentEmailCount").notNull(),
  emailLastSentAt: integer("emailLastSentAt", { mode: "timestamp_ms" }),
  emailLastSentStatus: text("emailLastSentStatus"),
  permissions: text("permissions", { mode: "json" })
    .$type<string[]>()
    .notNull(),
});

export const monitor = sqliteTable("monitor", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  name: text("name").notNull(),
  nameLower: text("nameLower").notNull(),
  description: text("description"),
  createdBy: text("createdBy").notNull(),
  updatedBy: text("updatedBy").notNull(),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
  appId: text("appId")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  filters: text("filters", { mode: "json" })
    .$type<LogPartFilterList>()
    .notNull(),
  lastRun: integer("lastRun", { mode: "timestamp_ms" }),
  nextRun: integer("nextRun", { mode: "timestamp_ms" }),
  status: text("status").$type<MonitorStatus>().notNull(),
  statusUpdatedAt: integer("statusUpdatedAt", {
    mode: "timestamp_ms",
  }).notNull(),
  reportsTo: text("reportsTo", { mode: "json" })
    .$type<IMonitorReportsTo[]>()
    .notNull(),
  duration: text("duration", { mode: "json" }).$type<Duration>().notNull(),
});

export const callbacks = sqliteTable("callback", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
  appId: text("appId")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  clientTokenId: text("clientTokenId")
    .references(() => clientTokens.id)
    .notNull(),
  url: text("url").notNull(),
  method: text("method").notNull(),
  requestHeaders: text("requestHeaders", { mode: "json" }).$type<
    Record<string, string>
  >(),
  requestBody: text("requestBody"),
  responseHeaders: text("responseHeaders", { mode: "json" }).$type<
    Record<string, string>
  >(),
  responseBody: text("responseBody"),
  responseStatusCode: integer("responseStatusCode"),
  executedAt: integer("executedAt", { mode: "timestamp_ms" }),
  error: text("error"),
  timeout: integer("timeout", { mode: "timestamp_ms" }),
  intervalFrom: integer("intervalFrom", { mode: "timestamp_ms" }),
  intervalMs: integer("intervalMs"),
  idempotencyKey: text("idempotencyKey"),
});

export const authIds = sqliteTable("authId", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  authId: text("authId").notNull(),
  appId: text("appId")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  clientTokenId: text("clientTokenId")
    .references(() => clientTokens.id)
    .notNull(),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
});

export const rooms = sqliteTable("room", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
  appId: text("appId")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  nameLower: text("nameLower").notNull(),
  description: text("description"),
  clientTokenId: text("clientTokenId")
    .references(() => clientTokens.id)
    .notNull(),
});

export const connectedAuthItems = sqliteTable("connectedAuthItem", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
  appId: text("appId")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  clientTokenId: text("clientTokenId")
    .references(() => clientTokens.id)
    .notNull(),
  authId: text("authId")
    .references(() => authIds.id)
    .notNull(),
  messageRoomId: text("messageRoomId"),
  messageSocketId: text("messageSocketId"),
  messageServer: integer("messageServer", { mode: "boolean" }),
  messageRoomSocket: text("messageRoomSocket"),
  messageAuthId: text("messageAuthId"),
});

export const connectedWebSockets = sqliteTable("connectedWebSocket", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
  appId: text("appId")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  authId: text("authId").references(() => authIds.id),
});

export const roomSubscriptions = sqliteTable("roomSubscription", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  roomId: text("roomId")
    .references(() => rooms.id, { onDelete: "cascade" })
    .notNull(),
  socketId: text("socketId").references(() => connectedWebSockets.id, {
    onDelete: "cascade",
  }),
  authId: text("authId").references(() => authIds.id, {
    onDelete: "cascade",
  }),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
  appId: text("appId")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  clientTokenId: text("clientTokenId").references(() => clientTokens.id),
});

export const appWebSocketConfigurations = sqliteTable(
  "appWebSocketConfiguration",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    createdBy: text("createdBy").notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
    updatedBy: text("updatedBy").notNull(),
    orgId: text("orgId")
      .references(() => orgs.id, { onDelete: "cascade" })
      .notNull(),
    appId: text("appId")
      .references(() => apps.id, { onDelete: "cascade" })
      .notNull(),
    allowWebSocketsWithoutAuthIds: integer("allowWebSocketsWithoutAuthIds", {
      mode: "boolean",
    }).notNull(),
    sendMessageToServerUrl: text("sendMessageToServerUrl"),
    sendMessageToServerHeaders: text("sendMessageToServerHeaders", {
      mode: "json",
    }).$type<Record<string, string>>(),
  }
);

export const messages = sqliteTable("message", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
  appId: text("appId")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  toRoomId: text("toRoomId").references(() => rooms.id, {
    onDelete: "cascade",
  }),
  fromSocketId: text("fromSocketId").references(() => connectedWebSockets.id),
  fromAuthId: text("fromAuthId").references(() => authIds.id),
  fromServer: integer("fromServer", { mode: "boolean" }),
  toSocketId: text("toSocketId").references(() => connectedWebSockets.id),
  toAuthId: text("toAuthId").references(() => authIds.id),
  toServer: integer("toServer", { mode: "boolean" }),
  message: text("message").notNull(),
});
