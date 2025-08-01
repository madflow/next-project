import { hashPassword } from "better-auth/crypto";
import { adminClient, adminPool } from "@repo/database/clients";
import { account, invitation, member, organization, project, rateLimit, session, user } from "@repo/database/schema";

interface CreateUserParams {
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  password: string;
}

async function createUser({ name, email, emailVerified, role, password }: CreateUserParams) {
  const now = new Date();

  try {
    // Create user
    const createdUser = await adminClient
      .insert(user)
      .values({
        name,
        email,
        emailVerified,
        role,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const userId = createdUser[0]?.id;
    if (!userId) throw new Error(`Failed to create user: ${email}`);

    // Create associated account
    await adminClient.insert(account).values({
      accountId: userId,
      providerId: "credential",
      userId,
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      scope: null,
      password: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    });

    console.log(`User created: ${email}`);
    return userId;
  } catch (error) {
    console.error(`Error creating user ${email}:`, error);
    throw error;
  }
}

async function createOrganization(name: string, slug: string) {
  const now = new Date("1990-01-01");

  // Create organization
  const createdOrganization = await adminClient
    .insert(organization)
    .values({
      name,
      createdAt: now,
      slug,
    })
    .returning();

  if (!createdOrganization || !createdOrganization[0]) {
    throw new Error(`Failed to create organization: ${name}`);
  }

  console.log(`Organization created: ${name}`);
  return createdOrganization[0];
}

async function createProject(name: string, slug: string, organizationId: string) {
  const now = new Date();

  // Create project
  const createdProject = await adminClient
    .insert(project)
    .values({
      name,
      slug,
      organizationId,
      createdAt: now,
    })
    .returning();

  if (!createdProject || !createdProject[0]) {
    throw new Error(`Failed to create project: ${name}`);
  }

  console.log(`Project created: ${name}`);
  return createdProject[0];
}

// Truncate tables in the correct order to respect foreign key constraints
console.log("Truncating tables...");
await adminClient.delete(session).execute();
await adminClient.delete(invitation).execute();
await adminClient.delete(member).execute();
await adminClient.delete(organization).execute();
await adminClient.delete(account).execute();
await adminClient.delete(user).execute();
await adminClient.delete(rateLimit).execute();
console.log("Tables truncated successfully\n");

// Create seed data
try {
  // Create organization
  const org = await createOrganization("Test Organization", "test-organization");

  // Create another organization
  const org2 = await createOrganization("Test Organization 2", "test-organization-2");

  // Create another organization
  const org3 = await createOrganization("Test Organization 3", "test-organization-3");

  // Create admin user and add to organization
  const adminUserId = await createUser({
    name: "Admin User",
    email: "admin@example.com",
    emailVerified: true,
    role: "admin",
    password: "Tester12345",
  });

  // Add admin as owner of the organization
  await adminClient.insert(member).values({
    organizationId: org.id,
    userId: adminUserId,
    role: "owner",
    createdAt: new Date(),
  });

  // Create regular user and add to organization
  const regularUserId = await createUser({
    name: "Regular User",
    email: "user@example.com",
    emailVerified: true,
    role: "user",
    password: "Tester12345",
  });

  // Add regular user as member of the organization
  await adminClient.insert(member).values({
    organizationId: org.id,
    userId: regularUserId,
    role: "member",
    createdAt: new Date(),
  });

  const profileChangerUserId = await createUser({
    name: "Profile Changer",
    email: "profile@example.com",
    emailVerified: true,
    role: "user",
    password: "Tester12345",
  });

  // Add profile changer as member of the organization
  await adminClient.insert(member).values({
    organizationId: org.id,
    userId: profileChangerUserId,
    role: "member",
    createdAt: new Date(),
  });

  // Create email changer user
  const emailChangerUserId = await createUser({
    name: "Email Changer",
    email: "emailchanger@example.com",
    emailVerified: true,
    role: "user",
    password: "Tester12345",
  });

  const avatarUserId = await createUser({
    name: "Avatar user",
    email: "avatar@example.com",
    emailVerified: true,
    role: "user",
    password: "Tester12345",
  });

  // Add email changer as member of the organization
  await adminClient.insert(member).values({
    organizationId: org.id,
    userId: emailChangerUserId,
    role: "member",
    createdAt: new Date(),
  });

  // Create account deleter user
  const accountDeleterUserId = await createUser({
    name: "Account Deleter",
    email: "accountdeleter@example.com",
    emailVerified: true,
    role: "user",
    password: "Tester12345",
  });

  const accountMultipleOrgsUserId = await createUser({
    name: "Account Multiple Orgs",
    email: "accountmultipleorgs@example.com",
    emailVerified: true,
    role: "user",
    password: "Tester12345",
  });

  const accountInNoOrgUserId = await createUser({
    name: "Account In No Org",
    email: "account-in-no-org@example.com",
    emailVerified: true,
    role: "user",
    password: "Tester12345",
  });

  const adminInNoOrgUserId = await createUser({
    name: "Admin In No Org",
    email: "admin-in-no-org@example.com",
    emailVerified: true,
    role: "admin",
    password: "Tester12345",
  });

  // Add account multiple orgs as member of the organization
  await adminClient.insert(member).values({
    organizationId: org.id,
    userId: accountMultipleOrgsUserId,
    role: "admin",
    createdAt: new Date(),
  });

  // Add account multiple orgs as member of the second organization
  await adminClient.insert(member).values({
    organizationId: org2.id,
    userId: accountMultipleOrgsUserId,
    role: "member",
    createdAt: new Date(),
  });

  // Add account multiple orgs as member of the third organization
  await adminClient.insert(member).values({
    organizationId: org3.id,
    userId: accountMultipleOrgsUserId,
    role: "owner",
    createdAt: new Date(),
  });

  // Add account deleter as member of the organization
  await adminClient.insert(member).values({
    organizationId: org.id,
    userId: accountDeleterUserId,
    role: "member",
    createdAt: new Date(),
  });

  await adminClient.insert(member).values({
    organizationId: org.id,
    userId: avatarUserId,
    role: "member",
    createdAt: new Date(),
  });

  // Create a test project in the organization
  await createProject("Test Project", "test-project", org.id);

  // Create two projects in the second organization
  await createProject("Test Project 2", "test-project-2", org2.id);
  await createProject("Test Project 3", "test-project-3", org2.id);

  // Create a test project in the third organization
  await createProject("Test Project 4", "test-project-4", org3.id);

  await adminPool.end();

  console.log("Seed completed successfully");
} catch (error) {
  console.error("Error during seed:", error);
  process.exit(1);
}
