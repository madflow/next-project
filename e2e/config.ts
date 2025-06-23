export const testUsers = {
  admin: {
    email: "admin@example.com",
    password: "Tester12345",
    name: "Admin User",
  },
  regularUser: {
    email: "user@example.com",
    password: "Tester12345",
    name: "Regular User",
  },
  profileChanger: {
    email: "profile@example.com",
    password: "Tester12345",
    name: "Profile Changer",
  },
  emailChanger: {
    email: "emailchanger@example.com",
    password: "Tester12345",
    name: "Email Changer",
  },
  accountDeleter: {
    email: "accountdeleter@example.com",
    password: "Tester12345",
    name: "Account Deleter",
  },
  avatarUser: {
    email: "avatar@example.com",
    password: "Tester12345",
    name: "Avatar user",
  },
  accountMultipleOrgs: {
    email: "accountmultipleorgs@example.com",
    password: "Tester12345",
    name: "Account Multiple Orgs",
  },
  accountInNoOrg: {
    email: "account-in-no-org@example.com",
    password: "Tester12345",
    name: "Account In No Org",
  },
  adminInNoOrg: {
    email: "admin-in-no-org@example.com",
    password: "Tester12345",
    name: "Admin In No Org",
  },
} as const;

export const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";

export const timeouts = {
  navigation: 10000, // 10 seconds
  action: 5000, // 5 seconds
  assertion: 5000, // 5 seconds
} as const;
