import { config } from "dotenv";
import { run } from "graphile-worker";
import "./instrument.js";
import { hello } from "./tasks/hello.js";

config({ quiet: true });

async function main() {
  console.log("Starting worker...");
  console.log(process.env.DATABASE_URL);
  const runner = await run({
    connectionString: process.env.DATABASE_URL,
    concurrency: 5,
    noHandleSignals: false,
    pollInterval: 1000,
    taskList: {
      hello,
    },
  });
  await runner.promise;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
