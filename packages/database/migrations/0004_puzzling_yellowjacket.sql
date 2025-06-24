ALTER TABLE "projects" DROP CONSTRAINT "project_slug_check";--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT "organization_slug_check";--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "project_slug_check" CHECK ("projects"."slug" ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$');--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organization_slug_check" CHECK ("organizations"."slug" ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$');