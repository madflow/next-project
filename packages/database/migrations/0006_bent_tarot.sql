CREATE TYPE "public"."dataset_variable_measure" AS ENUM('nominal', 'ordinal', 'scale', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."dataset_variable_type" AS ENUM('float', 'double', 'int8', 'int16', 'int32', 'string', 'unknown');--> statement-breakpoint
CREATE TABLE "dataset_variables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(64) NOT NULL,
	"label" text,
	"type" "dataset_variable_type" NOT NULL,
	"measure" "dataset_variable_measure" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"variable_labels" jsonb,
	"value_labels" jsonb,
	"dataset_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dataset_variables" ADD CONSTRAINT "dataset_variables_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;