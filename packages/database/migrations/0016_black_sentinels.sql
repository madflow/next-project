CREATE TYPE "public"."job_status" AS ENUM('created', 'retried', 'running', 'completed', 'expired', 'cancelled', 'failed');--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"queue_name" text NOT NULL,
	"task_identifier" text NOT NULL,
	"payload" jsonb NOT NULL,
	"run_at" timestamp with time zone NOT NULL,
	"max_attempts" integer DEFAULT 25 NOT NULL,
	"last_error" text,
	"status" "job_status" DEFAULT 'created' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
