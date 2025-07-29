import { createAdminCommand } from "./commands/create-admin.js";
import { makeCommand } from "./utils.js";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

const command = makeCommand("cli");

command.addCommand(createAdminCommand);

command.parse();
