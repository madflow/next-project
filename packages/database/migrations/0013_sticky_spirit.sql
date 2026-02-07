ALTER TABLE "dataset_variablesets" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "dataset_variablesets" ALTER COLUMN "category" SET DEFAULT 'general'::text;--> statement-breakpoint
DROP TYPE "public"."dataset_variableset_category";--> statement-breakpoint
CREATE TYPE "public"."dataset_variableset_category" AS ENUM('general', 'multi_response');--> statement-breakpoint
ALTER TABLE "dataset_variablesets" ALTER COLUMN "category" SET DEFAULT 'general'::"public"."dataset_variableset_category";--> statement-breakpoint
ALTER TABLE "dataset_variablesets" ALTER COLUMN "category" SET DATA TYPE "public"."dataset_variableset_category" USING "category"::"public"."dataset_variableset_category";--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "access_token_expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "refresh_token_expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "ban_expires" SET DATA TYPE timestamp with time zone;