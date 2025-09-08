CREATE TABLE "dataset_splitvariables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dataset_id" uuid NOT NULL,
	"variable_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dataset_splitvariables" ADD CONSTRAINT "dataset_splitvariables_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_splitvariables" ADD CONSTRAINT "dataset_splitvariables_variable_id_dataset_variables_id_fk" FOREIGN KEY ("variable_id") REFERENCES "public"."dataset_variables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dataset_splitvariables_unique_idx" ON "dataset_splitvariables" USING btree ("dataset_id","variable_id");--> statement-breakpoint
CREATE INDEX "dataset_splitvariables_dataset_id_idx" ON "dataset_splitvariables" USING btree ("dataset_id");