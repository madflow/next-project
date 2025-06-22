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
  profile: {
    email: "profile@example.com",
    password: "Tester12345",
    name: "Profile User",
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
    name: "Avatar User",
  },
} as const;

export const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";

export const timeouts = {
  navigation: 10000, // 10 seconds
  action: 5000, // 5 seconds
  assertion: 5000, // 5 seconds
} as const;
