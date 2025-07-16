import { createClient } from "@libsql/client";
import assert from "assert";
import { drizzle } from "drizzle-orm/libsql";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 as uuidv7 } from "uuid";
import type { FieldType } from "../common/indexer.js";

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

export const objFields = sqliteTable("objField", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  appId: text("appId").notNull(),
  groupId: text("groupId").notNull(),
  path: text("path").notNull(),
  type: text("type").notNull(),
  arrayTypes: text("arrayTypes", { mode: "json" })
    .$type<FieldType[]>()
    .notNull(),
  isArrayCompressed: integer("isArrayCompressed", {
    mode: "boolean",
  }).notNull(),
  tag: text("tag").notNull(),
});
