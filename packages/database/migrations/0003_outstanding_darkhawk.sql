CREATE TABLE "dataset_variablesets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" uuid,
	"dataset_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"order_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dataset_variableset_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variableset_id" uuid NOT NULL,
	"variable_id" uuid NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dataset_variablesets" ADD CONSTRAINT "dataset_variablesets_parent_id_dataset_variablesets_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."dataset_variablesets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_variablesets" ADD CONSTRAINT "dataset_variablesets_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_variableset_items" ADD CONSTRAINT "dataset_variableset_items_variableset_id_dataset_variablesets_id_fk" FOREIGN KEY ("variableset_id") REFERENCES "public"."dataset_variablesets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_variableset_items" ADD CONSTRAINT "dataset_variableset_items_variable_id_dataset_variables_id_fk" FOREIGN KEY ("variable_id") REFERENCES "public"."dataset_variables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dataset_variableset_name_dataset_idx" ON "dataset_variablesets" USING btree ("name","dataset_id");--> statement-breakpoint
CREATE INDEX "dataset_variablesets_dataset_id_idx" ON "dataset_variablesets" USING btree ("dataset_id");--> statement-breakpoint
CREATE INDEX "dataset_variablesets_parent_id_idx" ON "dataset_variablesets" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dataset_variableset_items_unique_idx" ON "dataset_variableset_items" USING btree ("variableset_id","variable_id");--> statement-breakpoint
CREATE INDEX "dataset_variableset_items_variableset_id_idx" ON "dataset_variableset_items" USING btree ("variableset_id");