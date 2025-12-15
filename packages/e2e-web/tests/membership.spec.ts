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

test.describe.configure({ mode: "parallel" });
test.describe("Organization members", () => {
  for (const testCase of testCases) {
    test(`user ${testCase.user} can navigate through organizations and projects`, async ({ page }) => {
      const user = testUsers[testCase.user];

      // Login
      await page.goto("/");
      await loginUser(page, user.email, user.password);

      // If user has no organizations, verify no organization is selected
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (testCase.organizations.length === 0) {
        // eslint-disable-next-line
        await expect(page.getByTestId("app.organization-switcher")).toContainText("Select organization");
        return;
      }

      // Test each organization and its projects
      for (const org of testCase.organizations) {
        const organizationSwitcher = page.getByTestId("app.organization-switcher");

        // Only switch organizations if user has multiple orgs
        // For single-org users, the org is already selected by default
        // eslint-disable-next-line playwright/no-conditional-in-test
        if (testCase.organizations.length > 1) {
          // Check if we need to switch (org not already selected)
          const currentOrgText = await organizationSwitcher.locator("span").textContent();
          // eslint-disable-next-line playwright/no-conditional-in-test
          if (currentOrgText !== org.name) {
            // Open dropdown and select the organization
            await organizationSwitcher.click();
            await page.getByTestId("app.organization-switcher.menu").getByText(org.name, { exact: true }).click();
          }
        }

        // Verify organization is selected
        await expect(organizationSwitcher.locator("span")).toHaveText(org.name);

        // Test each project in the organization
        for (const project of org.projects) {
          // Select project
          const projectSwitcher = page.getByTestId("app.project-switcher");
          await projectSwitcher.click();
          const openProject = page.getByTestId("app.project-switcher.menu").getByText(project, { exact: true });
          await openProject.click();

          // Verify project is selected
          await expect(projectSwitcher.locator("span")).toHaveText(project);

          // Test page reload
          await page.reload();
          await expect(page.getByTestId("app.organization-switcher").locator("span")).toHaveText(org.name);
          await expect(page.getByTestId("app.project-switcher").locator("span")).toHaveText(project);
        }
      }
    });
  }
});
