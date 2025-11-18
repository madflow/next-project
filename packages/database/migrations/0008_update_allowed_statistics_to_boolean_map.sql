-- Migration to convert allowedStatistics from enum to boolean map
-- This migration updates existing records that have the old enum format

-- Update records with "distribution" enum value to new boolean map
UPDATE "dataset_variableset_items"
SET "attributes" = jsonb_set(
  COALESCE("attributes", '{}'::jsonb),
  '{allowedStatistics}',
  '{"distribution": true, "mean": false}'::jsonb
)
WHERE "attributes"->>'allowedStatistics' = 'distribution';

-- Update records with "mean" enum value to new boolean map
UPDATE "dataset_variableset_items"
SET "attributes" = jsonb_set(
  COALESCE("attributes", '{}'::jsonb),
  '{allowedStatistics}',
  '{"distribution": false, "mean": true}'::jsonb
)
WHERE "attributes"->>'allowedStatistics' = 'mean';

-- Set default for records with NULL attributes
UPDATE "dataset_variableset_items"
SET "attributes" = '{"allowedStatistics": {"distribution": true, "mean": false}}'::jsonb
WHERE "attributes" IS NULL OR "attributes"->>'allowedStatistics' IS NULL;
