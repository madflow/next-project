import { makeCommand, printErrorLine, printSuccessLine } from "@repo/cli";
import { adminClient as client, adminPool as pool } from "@repo/database/clients";
import { user } from "@repo/database/schema";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

const command = makeCommand("cli");
const createAdminCommand = makeCommand("create-admin");
createAdminCommand.description("Create admin user");
createAdminCommand.requiredOption("--email <email>", "Email");
createAdminCommand.requiredOption("--name <name>", "Name");
createAdminCommand.action(async (options) => {
  const now = new Date();
  const adminUser: typeof user.$inferInsert = {
    name: options.name,
    email: options.email,
    emailVerified: false,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  };

  try {
    await client.insert(user).values(adminUser);
    await pool.end();
    printSuccessLine("Admin user created");
  } catch (error: unknown) {
    if (error instanceof Error) {
      printErrorLine(error.message);
    } else {
      throw error;
    }
  }
});

command.addCommand(createAdminCommand);

command.parse();
