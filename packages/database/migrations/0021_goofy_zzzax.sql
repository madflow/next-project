CREATE OR REPLACE FUNCTION public.enqueue_dataset_file_delete_job()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.storage_key IS NULL OR OLD.storage_key = '' THEN
        RETURN OLD;
    END IF;

    INSERT INTO public.jobs (queue_name, task_identifier, payload, run_at)
    VALUES (
        'default',
        'delete_dataset_files',
        pg_catalog.to_jsonb(OLD),
        pg_catalog.now()
    );

    RETURN OLD;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;
--> statement-breakpoint
CREATE TRIGGER trg_enqueue_dataset_file_delete_job
AFTER DELETE ON public.datasets
FOR EACH ROW EXECUTE PROCEDURE public.enqueue_dataset_file_delete_job();
