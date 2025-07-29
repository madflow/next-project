import { adminClient as client, adminPool as pool } from "@repo/database/clients";
import { user } from "@repo/database/schema";
import { makeCommand, printErrorLine, printSuccessLine } from "../utils.js";

const createAdminCommand = makeCommand("create-admin");
createAdminCommand.description("Create admin user");
createAdminCommand.requiredOption("--email <email>", "Email");
createAdminCommand.requiredOption("--name <name>", "Name");
createAdminCommand.action(async (options) => {
  const now = new Date();
  const adminUser: typeof user.$inferInsert = {
    name: options.name,
    email: options.email,
    emailVerified: true,
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

export { createAdminCommand };
