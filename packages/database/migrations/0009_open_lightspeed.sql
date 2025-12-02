ALTER TABLE "invitations" 
ADD COLUMN "created_at" timestamp with time zone;

UPDATE "invitations" 
SET "created_at" = now()
WHERE "created_at" IS NULL;

ALTER TABLE "invitations" 
ALTER COLUMN "created_at" SET NOT NULL;
