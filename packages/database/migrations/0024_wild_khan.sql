ALTER TABLE "dataset_metadata_files" DROP CONSTRAINT "dataset_metadata_files_uploaded_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "dataset_metadata_files" ALTER COLUMN "uploaded_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "dataset_metadata_files" ADD CONSTRAINT "dataset_metadata_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;