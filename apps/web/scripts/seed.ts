import { hashPassword } from "better-auth/crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { adminClient, adminPool } from "@repo/database/clients";
import {
  account,
  dataset,
  datasetProject,
  invitation,
  member,
  organization,
  project,
  rateLimit,
  session,
  user,
} from "@repo/database/schema";
import { deleteDataset } from "@/lib/storage";
import { createDataset as createDatasetService } from "@/lib/dataset-service";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ADMIN_USER_UID = "0198e599-eab0-7cb8-861f-72a8f6d7abb1";
const REGULAR_USER_UID = "0198e59c-e576-78d2-8606-61f0275aca5a";
const PROFILE_CHANGER_USER_UID = "0198e59e-c1c6-7c10-b6a4-c29b7f74a776";
const EMAIL_CHANGER_USER_UID = "0198e59f-0edd-7a89-9e7b-cf0460bc9efd";
const AVATAR_USER_UID = "0198e5a0-1cd3-78a5-9230-f4807fa7cb59";
const ACCOUNT_DELETER_USER_UID = "0198e5a1-839c-7421-9c3a-f7b8a6f7c32e";
const ACCOUNT_MULTIPLE_ORGS_USER_UID = "0198e5a0-66da-7e75-9dad-25c85825821a";
const ACCOUNT_IN_NO_ORG_USER_UID = "0198e5a5-3095-7924-8da5-2b8b4562f759";
const ADMIN_IN_NO_ORG_USER_UID = "0198e5a6-66eb-7351-b25b-df1a50bc53fa";

const ORG_TEST_UID = "0198e5a9-39c8-70db-9c7d-e11ab6d9aea7";
const ORG_TEST_2_UID = "0198e5a9-0dac-7b95-a7a5-c9aa87a7f5c4";
const ORG_TEST_3_UID = "0198e5a9-66f2-7391-ba86-1c7ae2127625";
const PROJECT_TEST_UID = "0198e5a9-a975-7ac3-9eec-a70e2a3df131";
const PROJECT_TEST_2_UID = "0198e5ac-2685-7e65-9308-5c8c249eea09";
const PROJECT_TEST_3_UID = "0198e5ac-510d-78b1-bc34-3a5e24ec7788";
const PROJECT_TEST_4_UID = "0198e5ac-7a6c-7d0c-bedd-6a74ff7bfe59";

const DATASET_TEST_UID = "0198e639-3e96-734b-b0db-af0c4350a2c4";
const DATASET_TEST_2_UID = "0198e639-3e96-734b-b0db-af0c4350a2c5";

interface CreateUserParams {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  password: string;
}

async function createUser({ id, name, email, emailVerified, role, password }: CreateUserParams) {
  const now = new Date();

  try {
    // Create user
    const createdUser = await adminClient
      .insert(user)
      .values({
        id,
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

async function createOrganization(id: string, name: string, slug: string) {
  const now = new Date("1990-01-01");

  // Create organization
  const createdOrganization = await adminClient
    .insert(organization)
    .values({
      id,
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

async function createProject(id: string, name: string, slug: string, organizationId: string) {
  const now = new Date();

  // Create project
  const createdProject = await adminClient
    .insert(project)
    .values({
      id,
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

async function createDataset(id: string, name: string, organizationId: string, projectId: string) {
  const datasetBuffer = await readFile(join(__dirname, "./fixtures/demo.sav"));
  const file = new File([new Uint8Array(datasetBuffer)], "demo.sav");
  const contentType = "application/octet-stream";
  
  const result = await createDatasetService({
    file,
    name,
    organizationId,
    contentType,
    missingValues: null,
    id, // Pass the predefined ID
  });

  if (!result.success) {
    throw new Error(`Failed to create dataset: ${result.error}`);
  }

  await adminClient.insert(datasetProject).values({
    projectId,
    datasetId: id,
  });
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
const datasets = await adminClient.select().from(dataset);
for (const dataset of datasets) {
  await deleteDataset(dataset.storageKey);
}
await adminClient.delete(dataset).execute();
console.log("Tables truncated successfully\n");

// Create seed data
try {
  // Create organization
  const org = await createOrganization(ORG_TEST_UID, "Test Organization", "test-organization");

  // Create another organization
  const org2 = await createOrganization(ORG_TEST_2_UID, "Test Organization 2", "test-organization-2");

  // Create another organization
  const org3 = await createOrganization(ORG_TEST_3_UID, "Test Organization 3", "test-organization-3");

  // Create admin user and add to organization
  const adminUserId = await createUser({
    id: ADMIN_USER_UID,
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
    id: REGULAR_USER_UID,
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
    id: PROFILE_CHANGER_USER_UID,
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
    id: EMAIL_CHANGER_USER_UID,
    name: "Email Changer",
    email: "emailchanger@example.com",
    emailVerified: true,
    role: "user",
    password: "Tester12345",
  });

  const avatarUserId = await createUser({
    id: AVATAR_USER_UID,
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
    id: ACCOUNT_DELETER_USER_UID,
    name: "Account Deleter",
    email: "accountdeleter@example.com",
    emailVerified: true,
    role: "user",
    password: "Tester12345",
  });

  const accountMultipleOrgsUserId = await createUser({
    id: ACCOUNT_MULTIPLE_ORGS_USER_UID,
    name: "Account Multiple Orgs",
    email: "accountmultipleorgs@example.com",
    emailVerified: true,
    role: "user",
    password: "Tester12345",
  });

  await createUser({
    id: ACCOUNT_IN_NO_ORG_USER_UID,
    name: "Account In No Org",
    email: "account-in-no-org@example.com",
    emailVerified: true,
    role: "user",
    password: "Tester12345",
  });

  await createUser({
    id: ADMIN_IN_NO_ORG_USER_UID,
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
  await createProject(PROJECT_TEST_UID, "Test Project", "test-project", org.id);

  // Create two projects in the second organization
  await createProject(PROJECT_TEST_2_UID, "Test Project 2", "test-project-2", org2.id);
  await createProject(PROJECT_TEST_3_UID, "Test Project 3", "test-project-3", org2.id);

  // Create a test project in the third organization
  await createProject(PROJECT_TEST_4_UID, "Test Project 4", "test-project-4", org3.id);

  await createDataset(DATASET_TEST_UID, "Test Dataset", org.id, PROJECT_TEST_UID);
  await createDataset(DATASET_TEST_2_UID, "Test Dataset 2", org3.id, PROJECT_TEST_4_UID);

  await adminPool.end();

  console.log("Seed completed successfully");
} catch (error) {
  console.error("Error during seed:", error);
  process.exit(1);
}
