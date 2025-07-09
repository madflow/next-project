CREATE TABLE "dataset_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"dataset_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dataset_projects" ADD CONSTRAINT "dataset_projects_project_id_datasets_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_projects" ADD CONSTRAINT "dataset_projects_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;