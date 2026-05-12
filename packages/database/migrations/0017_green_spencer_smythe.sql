CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
      NEW.updated_at = now(); 
      RETURN NEW;
   ELSE
      RETURN OLD;
   END IF;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION create_worker_job() RETURNS TRIGGER AS $$
    DECLARE
        _payload json := jsonb_build_object('job_id', NEW.id) || jsonb_build_object('data', NEW.payload::jsonb);
    BEGIN
        IF EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'graphile_worker') IS False THEN
            RAISE NOTICE 'graphile_worker schema does not exist';
        UPDATE public.jobs SET status='cancelled'::job_status, last_error = 'graphile_worker schema does not exist' WHERE id=NEW.id;
        RETURN NEW;
        END IF;

        PERFORM graphile_worker.add_job(
            NEW.task_identifier, 
            payload := _payload, 
            queue_name := NEW.queue_name, 
            run_at := NEW.run_at,
            max_attempts := NEW.max_attempts
        );
        RETURN NEW;
    END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER 
trg_jobs_updated_timestamp 
BEFORE UPDATE ON public.jobs 
FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();

CREATE TRIGGER trg_create_worker_job 
AFTER INSERT ON public.jobs 
FOR EACH ROW EXECUTE PROCEDURE create_worker_job()
