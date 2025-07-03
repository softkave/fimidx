CREATE TABLE "objs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"created_by_type" text NOT NULL,
	"app_id" text NOT NULL,
	"group_id" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	"updated_by_type" text NOT NULL,
	"tag" text NOT NULL,
	"obj_record" jsonb NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" text,
	"deleted_by_type" text,
	"should_index" boolean DEFAULT true NOT NULL,
	"fields_to_index" jsonb
);
