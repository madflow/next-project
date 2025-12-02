-- Migration to set default attributes for dataset_variableset_items
-- This ensures all existing records have the default attributes when the field is null or empty

-- Set default attributes for records where attributes is NULL
UPDATE "dataset_variableset_items"
SET "attributes" = '{"allowedStatistics": {"distribution": true, "mean": false}}'::jsonb
WHERE "attributes" IS NULL;

-- Set default attributes for records where attributes is an empty object
UPDATE "dataset_variableset_items"
SET "attributes" = '{"allowedStatistics": {"distribution": true, "mean": false}}'::jsonb
WHERE "attributes" = '{}'::jsonb;

-- Set default allowedStatistics for records where allowedStatistics is missing or null
UPDATE "dataset_variableset_items"
SET "attributes" = jsonb_set(
  "attributes",
  '{allowedStatistics}',
  '{"distribution": true, "mean": false}'::jsonb
)
WHERE "attributes" IS NOT NULL
  AND "attributes" != '{}'::jsonb
  AND ("attributes"->'allowedStatistics' IS NULL OR "attributes"->'allowedStatistics' = 'null'::jsonb);
