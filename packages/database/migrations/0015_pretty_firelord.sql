CREATE TYPE "public"."dataset_metadata_file_type" AS ENUM('questionnaire', 'variable_descriptions', 'documentation', 'other');--> statement-breakpoint
CREATE TABLE "dataset_metadata_files" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"dataset_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"file_type" text NOT NULL,
	"file_size" bigint NOT NULL,
	"file_hash" text NOT NULL,
	"s3_key" text NOT NULL,
	"metadata_type" "dataset_metadata_file_type" DEFAULT 'other' NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "dataset_metadata_files" ADD CONSTRAINT "dataset_metadata_files_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_metadata_files" ADD CONSTRAINT "dataset_metadata_files_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_metadata_files" ADD CONSTRAINT "dataset_metadata_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dataset_metadata_files_dataset_id_idx" ON "dataset_metadata_files" USING btree ("dataset_id");--> statement-breakpoint
CREATE INDEX "dataset_metadata_files_org_id_idx" ON "dataset_metadata_files" USING btree ("organization_id");