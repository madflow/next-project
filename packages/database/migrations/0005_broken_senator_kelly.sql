CREATE TABLE "datafiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"filename" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" bigint NOT NULL,
	"file_hash" text NOT NULL,
	"s3_key" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"project_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "datafiles" ADD CONSTRAINT "datafiles_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;