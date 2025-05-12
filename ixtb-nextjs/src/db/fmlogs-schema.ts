import { createClient } from "@libsql/client";
import assert from "assert";
import { Duration } from "date-fns";
import { drizzle } from "drizzle-orm/libsql";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 as uuidv7 } from "uuid";
import { WebSocketAccessType } from "../definitions/configurations";
import { LogPartFilterList } from "../definitions/log";
import { MemberStatus } from "../definitions/members";
import { IMonitorReportsTo, MonitorStatus } from "../definitions/monitor";
import { RoomAccessType } from "../definitions/room";
import {
  ConnectedAuthItemAccessType,
  HashedAuthIdUsage,
} from "../definitions/websocket";

const fmlogsDbURL = process.env.FMLOGS_DB_TURSO_DATABASE_URL;
const fmlogsDbAuthToken = process.env.FMLOGS_DB_TURSO_AUTH_TOKEN;

assert.ok(fmlogsDbURL, "FMLOGS_DB_TURSO_DATABASE_URL is required");
assert.ok(fmlogsDbAuthToken, "FMLOGS_DB_TURSO_AUTH_TOKEN is required");

const fmlogsClient = createClient({
  authToken: fmlogsDbAuthToken,
  url: fmlogsDbURL,
});

export const db = drizzle(fmlogsClient);

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
});

export const hashedAuthIds = sqliteTable("hashedAuthId", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  hashedAuthId: text("hashedAuthId").notNull(),
  appId: text("appId")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  usage: text("usage").$type<HashedAuthIdUsage>().notNull(),
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
  accessType: text("accessType").$type<RoomAccessType>().notNull(),
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
  hashedAuthId: text("hashedAuthId")
    .references(() => hashedAuthIds.id)
    .notNull(),
  roomId: text("roomId").references(() => rooms.id, { onDelete: "cascade" }),
  accessType: text("accessType").$type<ConnectedAuthItemAccessType>().notNull(),
});

export const connectedSockets = sqliteTable("connectedSocket", {
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
  hashedAuthId: text("hashedAuthId").references(() => hashedAuthIds.id),
  socketId: text("socketId").notNull(),
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
  socketId: text("socketId").references(() => connectedSockets.socketId, {
    onDelete: "cascade",
  }),
  hashedAuthId: text("hashedAuthId").references(() => hashedAuthIds.id, {
    onDelete: "cascade",
  }),
  orgId: text("orgId")
    .references(() => orgs.id, { onDelete: "cascade" })
    .notNull(),
  appId: text("appId")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
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
    websocketAccessType: text("websocketAccessType")
      .$type<WebSocketAccessType>()
      .notNull(),
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
  roomId: text("roomId").references(() => rooms.id, { onDelete: "cascade" }),
  fromSocketId: text("fromSocketId").references(
    () => connectedSockets.socketId
  ),
  fromHashedAuthId: text("fromHashedAuthId").references(() => hashedAuthIds.id),
  toSocketId: text("toSocketId").references(() => connectedSockets.socketId),
  toHashedAuthId: text("toHashedAuthId").references(() => hashedAuthIds.id),
  message: text("message").notNull(),
});

export const messageAcks = sqliteTable("messageAck", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  acked: integer("acked", { mode: "boolean" }).notNull(),
  ackedAt: integer("ackedAt", { mode: "timestamp_ms" }).notNull(),
  messageId: text("messageId")
    .references(() => messages.id, { onDelete: "cascade" })
    .notNull(),
  socketId: text("socketId").references(() => connectedSockets.socketId, {
    onDelete: "cascade",
  }),
});
