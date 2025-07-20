ALTER TABLE "datasets" ADD COLUMN "missing_values" jsonb;--> statement-breakpoint
ALTER TABLE "dataset_variables" ADD COLUMN "missing_values" jsonb;