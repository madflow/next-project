export const testUsers = {
  admin: {
    id: "0198e599-eab0-7cb8-861f-72a8f6d7abb1",
    email: "admin@example.com",
    password: "Tester12345",
    name: "Admin User",
  },
  regularUser: {
    id: "0198e59c-e576-78d2-8606-61f0275aca5a",
    email: "user@example.com",
    password: "Tester12345",
    name: "Regular User",
  },
  profileChanger: {
    id: "0198e59e-c1c6-7c10-b6a4-c29b7f74a776",
    email: "profile@example.com",
    password: "Tester12345",
    name: "Profile Changer",
  },
  emailChanger: {
    id: "0198e59f-0edd-7a89-9e7b-cf0460bc9efd",
    email: "emailchanger@example.com",
    password: "Tester12345",
    name: "Email Changer",
  },
  accountDeleter: {
    id: "0198e5a1-839c-7421-9c3a-f7b8a6f7c32e",
    email: "accountdeleter@example.com",
    password: "Tester12345",
    name: "Account Deleter",
  },
  avatarUser: {
    id: "0198e5a0-1cd3-78a5-9230-f4807fa7cb59",
    email: "avatar@example.com",
    password: "Tester12345",
    name: "Avatar user",
  },
  accountMultipleOrgs: {
    id: "0198e5a0-66da-7e75-9dad-25c85825821a",
    email: "accountmultipleorgs@example.com",
    password: "Tester12345",
    name: "Account Multiple Orgs",
  },
  accountInNoOrg: {
    id: "0198e5a5-3095-7924-8da5-2b8b4562f759",
    email: "account-in-no-org@example.com",
    password: "Tester12345",
    name: "Account In No Org",
  },
  adminInNoOrg: {
    id: "0198e5a6-66eb-7351-b25b-df1a50bc53fa",
    email: "admin-in-no-org@example.com",
    password: "Tester12345",
    name: "Admin In No Org",
  },
  inviteTarget: {
    id: "0198e5a7-9bcd-7abc-8ef0-1234567890ab",
    email: "invite-target@example.com",
    password: "Tester12345",
    name: "Invite Target",
  },
} as const;

export type AuthenticatedUser = keyof typeof testUsers;

export const testIds = {
  organizations: {
    primary: "0198e5a9-39c8-70db-9c7d-e11ab6d9aea7",
    secondary: "0198e5a9-0dac-7b95-a7a5-c9aa87a7f5c4",
    tertiary: "0198e5a9-66f2-7391-ba86-1c7ae2127625",
  },
  projects: {
    primary: "0198e5a9-a975-7ac3-9eec-a70e2a3df131",
    secondary: "0198e5ac-2685-7e65-9308-5c8c249eea09",
    tertiary: "0198e5ac-510d-78b1-bc34-3a5e24ec7788",
    quaternary: "0198e5ac-7a6c-7d0c-bedd-6a74ff7bfe59",
  },
  datasets: {
    primary: "0198e639-3e96-734b-b0db-af0c4350a2c4",
    withVariablesets: "0198e639-3e96-734b-b0db-af0c4350a2c5",
  },
  variablesets: {
    mediaUse: "0198e639-3e96-734b-b0db-af0c4350a2d1",
    informationSources: "0198e639-3e96-734b-b0db-af0c4350a2d2",
  },
  nonExistent: "00000000-0000-0000-0000-000000000000",
} as const;

export const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";

export const resolvedBaseUrl = process.env.BASE_URL || baseUrl;

export const timeouts = {
  navigation: 10000, // 10 seconds
  action: 5000, // 5 seconds
  assertion: 5000, // 5 seconds
} as const;
