import { Command } from "commander";
import "dotenv/config";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

async function main() {
  const program = new Command("cli");
  program.parse();
}

main();
