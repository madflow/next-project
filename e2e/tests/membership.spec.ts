import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

type TestCase = {
  user: keyof typeof testUsers;
  organizations: Array<{
    name: string;
    projects: string[];
  }>;
};

const testCases: TestCase[] = [
  {
    user: "regularUser",
    organizations: [
      {
        name: "Test Organization",
        projects: ["Test Project"],
      },
    ],
  },
  {
    user: "admin",
    organizations: [
      {
        name: "Test Organization",
        projects: ["Test Project"],
      },
    ],
  },
  {
    user: "accountMultipleOrgs",
    organizations: [
      {
        name: "Test Organization 2",
        projects: ["Test Project 2"],
      },
      {
        name: "Test Organization 3",
        projects: ["Test Project 4"],
      },
    ],
  },
  {
    user: "accountInNoOrg",
    organizations: [],
  },
];

test.describe("Organization members", () => {
  for (const testCase of testCases) {
    test(`user ${testCase.user} can navigate through organizations and projects`, async ({ page }) => {
      const user = testUsers[testCase.user];

      // Login
      await page.goto("/");
      await loginUser(page, user.email, user.password);

      // If user has no organizations, verify no organization is selected
      if (testCase.organizations.length === 0) {
        await expect(page.getByTestId("app.organization-switcher")).toContainText("Select organization");
        return;
      }

      // Test each organization and its projects
      for (const org of testCase.organizations) {
        // Wait for projects to load when switching organizations
        const projectsResponsePromise = page.waitForResponse(/projects/);

        // Select organization
        await page.getByTestId("app.organization-switcher").click();
        await page.getByText(org.name, { exact: true }).click();
        await projectsResponsePromise;

        // Verify organization is selected
        await expect(page.getByTestId("app.organization-switcher").locator("span")).toHaveText(org.name);

        // Test each project in the organization
        for (const project of org.projects) {
          // Select project
          await page.getByTestId("app.project-switcher").click();
          await page.getByText(project, { exact: true }).click();

          // Verify project is selected
          await expect(page.getByTestId("app.project-switcher").locator("span")).toHaveText(project);

          // Test page reload
          await page.reload();
          await expect(page.getByTestId("app.organization-switcher").locator("span")).toHaveText(org.name);
          await expect(page.getByTestId("app.project-switcher").locator("span")).toHaveText(project);
        }
      }
    });
  }
});
