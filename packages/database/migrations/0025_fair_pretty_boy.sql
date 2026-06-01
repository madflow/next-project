ALTER TABLE "dataset_metadata_files" RENAME COLUMN "s3_key" TO "storage_key";

CREATE OR REPLACE FUNCTION public.enqueue_dataset_metadata_file_delete_job()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.storage_key IS NULL OR OLD.storage_key = '' THEN
        RETURN OLD;
    END IF;

    INSERT INTO public.jobs (queue_name, task_identifier, payload, run_at)
    VALUES (
        'default',
        'delete_dataset_metadata_files',
        pg_catalog.to_jsonb(OLD),
        pg_catalog.now()
    );

    RETURN OLD;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;
