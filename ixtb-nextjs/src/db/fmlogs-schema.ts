import { createClient } from "@libsql/client";
import assert from "assert";
import { Duration } from "date-fns";
import { drizzle } from "drizzle-orm/libsql";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 as uuidv7 } from "uuid";
import { LogPartFilterList } from "../definitions/log";
import { MemberStatus } from "../definitions/members";
import { IMonitorReportsTo, MonitorStatus } from "../definitions/monitor";

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
