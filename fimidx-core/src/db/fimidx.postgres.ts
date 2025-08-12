import { drizzle } from "drizzle-orm/node-postgres";
import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { getCoreConfig } from "../common/getCoreConfig.js";

const { postgres } = getCoreConfig();

export const fimidxPostgresDb = drizzle(postgres.url);

// IObj schema
export const objs = pgTable("objs", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
  createdByType: text("created_by_type").notNull(),
  appId: text("app_id").notNull(),
  groupId: text("group_id").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: text("updated_by").notNull(),
  updatedByType: text("updated_by_type").notNull(),
  tag: text("tag").notNull(),
  objRecord: jsonb("obj_record").notNull(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: text("deleted_by"),
  deletedByType: text("deleted_by_type"),
  shouldIndex: boolean("should_index").notNull().default(true),
  fieldsToIndex: jsonb("fields_to_index").$type<string[]>(),
});

// IObjField schema
// export const objFields = pgTable("obj_fields", {
//   id: text("id").primaryKey(),
//   field: text("field").notNull(),
//   fieldKeys: jsonb("field_keys").$type<string[]>().notNull(),
//   fieldKeyTypes: jsonb("field_key_types").$type<string[]>().notNull(),
//   valueTypes: jsonb("value_types").$type<string[]>().notNull(),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
//   appId: text("app_id").notNull(),
//   groupId: text("group_id").notNull(),
//   tag: text("tag").notNull(),
// });

// IObjPart schema
// export const objParts = pgTable("obj_parts", {
//   id: text("id").primaryKey(),
//   objId: text("obj_id").notNull(),
//   field: text("field").notNull(),
//   value: text("value").notNull(),
//   valueNumber: integer("value_number"),
//   valueBoolean: boolean("value_boolean"),
//   type: text("type").notNull(),
//   appId: text("app_id").notNull(),
//   groupId: text("group_id").notNull(),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
//   tag: text("tag").notNull(),
// });
