ALTER TABLE "dataset_projects" DROP CONSTRAINT "dataset_projects_project_id_datasets_id_fk";
--> statement-breakpoint
ALTER TABLE "dataset_projects" ADD CONSTRAINT "dataset_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dataset_project_unique_idx" ON "dataset_projects" USING btree ("project_id","dataset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dataset_variable_unique_idx" ON "dataset_variables" USING btree ("name","dataset_id");