import { run } from "graphile-worker";
import { adminPool } from "@repo/database/clients";

async function main() {
  const runner = await run({
    pgPool: adminPool,
    concurrency: 5,
    noHandleSignals: false,
    pollInterval: 1000,
    taskList: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hello: async (payload: any, helpers) => {
        if (!payload.name) {
          throw new Error("Missing name");
        }
        const { name } = payload;
        helpers.logger.info(`Hello, ${name}`);
      },
    },
  });
  await runner.promise;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
