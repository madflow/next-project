// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const hello = async (payload: any, helpers: any) => {
  const { data, job_id } = payload;
  helpers.logger.info(`Hello, ${data.name} (job_id: ${job_id})`);
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  await helpers.withPgClient(async (client: any) => {
    await client.query("UPDATE public.jobs SET status = 'completed'::job_status WHERE id = $1", [job_id]);
  });
};

export { hello };
