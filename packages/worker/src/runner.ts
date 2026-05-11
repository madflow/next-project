import { config } from "dotenv";
import { run } from "graphile-worker";
import { createAdminClient } from "@repo/database/clients";
import "./instrument.js";
import { helloWorldTask } from "./tasks/hello-world.js";

config({ quiet: true });

async function main() {
  const db = createAdminClient();

  const runner = await run({
    pgPool: db.$client,
    concurrency: 5,
    noHandleSignals: false,
    pollInterval: 1000,
    taskList: {
      helloWorldTask,
    },
  });
  await runner.promise;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
