CREATE TYPE "public"."dataset_variableset_content_type" AS ENUM('variable', 'subset');--> statement-breakpoint
CREATE TABLE "dataset_variableset_contents" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"variableset_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"content_type" "dataset_variableset_content_type" NOT NULL,
	"variable_id" uuid,
	"subset_id" uuid,
	"attributes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "content_type_variable_check" CHECK (("dataset_variableset_contents"."content_type" != 'variable' OR ("dataset_variableset_contents"."variable_id" IS NOT NULL AND "dataset_variableset_contents"."subset_id" IS NULL))),
	CONSTRAINT "content_type_subset_check" CHECK (("dataset_variableset_contents"."content_type" != 'subset' OR ("dataset_variableset_contents"."subset_id" IS NOT NULL AND "dataset_variableset_contents"."variable_id" IS NULL)))
);
--> statement-breakpoint
ALTER TABLE "dataset_variablesets" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "dataset_variablesets" ALTER COLUMN "category" SET DEFAULT 'general'::text;--> statement-breakpoint
DROP TYPE "public"."dataset_variableset_category";--> statement-breakpoint
CREATE TYPE "public"."dataset_variableset_category" AS ENUM('general', 'multi_response');--> statement-breakpoint
ALTER TABLE "dataset_variablesets" ALTER COLUMN "category" SET DEFAULT 'general'::"public"."dataset_variableset_category";--> statement-breakpoint
ALTER TABLE "dataset_variablesets" ALTER COLUMN "category" SET DATA TYPE "public"."dataset_variableset_category" USING "category"::"public"."dataset_variableset_category";--> statement-breakpoint
ALTER TABLE "dataset_variableset_contents" ADD CONSTRAINT "dataset_variableset_contents_variableset_id_dataset_variablesets_id_fk" FOREIGN KEY ("variableset_id") REFERENCES "public"."dataset_variablesets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_variableset_contents" ADD CONSTRAINT "dataset_variableset_contents_variable_id_dataset_variables_id_fk" FOREIGN KEY ("variable_id") REFERENCES "public"."dataset_variables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_variableset_contents" ADD CONSTRAINT "dataset_variableset_contents_subset_id_dataset_variablesets_id_fk" FOREIGN KEY ("subset_id") REFERENCES "public"."dataset_variablesets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dataset_variableset_contents_variable_idx" ON "dataset_variableset_contents" USING btree ("variableset_id","variable_id") WHERE "dataset_variableset_contents"."content_type" = 'variable';--> statement-breakpoint
CREATE UNIQUE INDEX "dataset_variableset_contents_subset_idx" ON "dataset_variableset_contents" USING btree ("variableset_id","subset_id") WHERE "dataset_variableset_contents"."content_type" = 'subset';--> statement-breakpoint
CREATE INDEX "dataset_variableset_contents_set_position_idx" ON "dataset_variableset_contents" USING btree ("variableset_id","position");--> statement-breakpoint

-- Data migration: populate dataset_variableset_contents from existing tables
-- Step 1: Migrate variables from dataset_variableset_items (position = order_index * 100)
INSERT INTO "dataset_variableset_contents" ("variableset_id", "position", "content_type", "variable_id", "attributes")
SELECT
  "variableset_id",
  "order_index" * 100,
  'variable'::"dataset_variableset_content_type",
  "variable_id",
  "attributes"
FROM "dataset_variableset_items";--> statement-breakpoint

-- Step 2: Migrate child variablesets (subsets) as content entries in their parent set
-- Position starts after the last variable in each parent set
INSERT INTO "dataset_variableset_contents" ("variableset_id", "position", "content_type", "subset_id")
SELECT
  vs."parent_id",
  COALESCE(max_var.max_pos, 0) + 100 + vs."order_index" * 100,
  'subset'::"dataset_variableset_content_type",
  vs."id"
FROM "dataset_variablesets" vs
LEFT JOIN LATERAL (
  SELECT MAX("position") AS max_pos
  FROM "dataset_variableset_contents"
  WHERE "variableset_id" = vs."parent_id"
    AND "content_type" = 'variable'
) max_var ON true
WHERE vs."parent_id" IS NOT NULL;