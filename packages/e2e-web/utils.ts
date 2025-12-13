import { Page, expect } from "@playwright/test";
import { MailpitClient } from "mailpit-api";
import assert from "node:assert";

const { SMTP_SERVER_API } = process.env;
assert(SMTP_SERVER_API);

const smtpServerApi = new MailpitClient(SMTP_SERVER_API);

// Sleep function removed - use proper wait conditions instead

export async function loginUser(page: Page, email: string, password: string) {
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("data-testid=auth.login.form.email");
  await page.getByTestId("auth.login.form.email").fill(email);
  await page.getByTestId("auth.login.form.password").fill(password);

  const getSessionResponse = page.waitForResponse(
    (response) => response.url().includes("/api/auth/get-session") && response.status() === 200
  );
  await page.getByTestId("auth.login.form.submit").click();

  await getSessionResponse;

  await page.waitForLoadState("networkidle");
  await page.waitForSelector("data-testid=app.sidebar.user-menu-trigger");
}

export async function logoutUser(page: Page) {
  await page.getByTestId("app.sidebar.user-menu-trigger").click();
  await page.getByTestId("app.sign-out").click();
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("data-testid=auth.login.form.submit");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractLinkFromMessage = async (message: any, linkFragment: string) => {
  const linkCheck = await smtpServerApi.linkCheck(message.ID);
  let foundLink = "";
  for (const link of linkCheck.Links) {
    if (link.URL.includes(linkFragment)) {
      foundLink = link.URL;
    }
  }
  return foundLink;
};

/**
 * Wait for an element to be visible with proper error handling
 */
export async function waitForElementVisible(page: Page, testId: string, timeout = 5000) {
  await page.waitForSelector(`data-testid=${testId}`, { state: "visible", timeout });
  return page.getByTestId(testId);
}

/**
 * Wait for an element to be hidden
 */
export async function waitForElementHidden(page: Page, testId: string, timeout = 5000) {
  await page.waitForSelector(`data-testid=${testId}`, { state: "hidden", timeout });
}

/**
 * Select a dataset from dropdown with proper waits
 */
export async function selectDataset(page: Page, datasetName: string) {
  await waitForElementVisible(page, "app.dropdown.dataset.trigger");
  await page.getByTestId("app.dropdown.dataset.trigger").click();

  // Wait for dropdown options to be visible
  await page.waitForSelector(`text=${datasetName}`, { state: "visible" });
  await page.getByText(datasetName).click();

  // Verify dataset is selected
  const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
  await expect(datasetTrigger).toContainText(datasetName);

  // Wait for variable groups to load
  await page.waitForLoadState("networkidle");
  return datasetTrigger;
}

/**
 * Find and click a variable by name or fallback to first available
 */
export async function selectVariable(page: Page, preferredVariableName?: string) {
  const variableGroups = page.locator('[data-testid^="variable-group-"]');
  const groupCount = await variableGroups.count();

  if (groupCount === 0) {
    throw new Error("No variable groups available");
  }

  // Try to find preferred variable first
  if (preferredVariableName) {
    const preferredVariable = page.getByTestId(`variable-item-${preferredVariableName}`);
    if ((await preferredVariable.count()) > 0) {
      await preferredVariable.click();
      await page.waitForLoadState("networkidle");
      return preferredVariable;
    }
  }

  // Fallback: expand first group and select first variable
  const firstGroup = variableGroups.first();
  await firstGroup.click();
  await page.waitForLoadState("networkidle");

  const variables = page.locator('[data-testid^="variable-item-"]');
  const variableCount = await variables.count();

  if (variableCount === 0) {
    throw new Error("No variables found in group");
  }

  const firstVariable = variables.first();
  await firstVariable.click();
  await page.waitForLoadState("networkidle");
  return firstVariable;
}

/**
 * Wait for chart/visualization to be visible
 */
export async function waitForChart(page: Page, timeout = 5000) {
  const chartSelectors = [
    '[data-testid*="chart"]',
    '[data-testid*="visualization"]',
    '[class*="recharts"]',
    "canvas",
    "svg",
  ];

  for (const selector of chartSelectors) {
    try {
      await page.waitForSelector(selector, { state: "visible", timeout });
      return page.locator(selector).first();
    } catch {
      // Continue to next selector
    }
  }

  throw new Error("No chart/visualization found");
}

export { smtpServerApi };
