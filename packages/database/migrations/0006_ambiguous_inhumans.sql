ALTER TABLE "accounts" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "datasets" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "dataset_projects" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "dataset_splitvariables" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "dataset_variables" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "dataset_variablesets" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "dataset_variableset_items" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "rate_limits" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "id" SET DEFAULT uuidv7();