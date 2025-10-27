import { Page } from "@playwright/test";
import { MailpitClient } from "mailpit-api";
import assert from "node:assert";

const { SMTP_SERVER_API } = process.env;
assert(SMTP_SERVER_API);

const smtpServerApi = new MailpitClient(SMTP_SERVER_API);

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loginUser(page: Page, email: string, password: string) {
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("data-testid=auth.login.form.email");
  await page.getByTestId("auth.login.form.email").fill(email);
  await page.getByTestId("auth.login.form.password").fill(password);

  // Check for rate limiting before clicking submit
  const rateLimitAlert = page.locator('div[role="alert"]:has-text("Too many requests")');
  const hasRateLimit = (await rateLimitAlert.count()) > 0;

  if (hasRateLimit) {
    // Wait 2 seconds for rate limit to clear
    await sleep(2000);
  }

  await page.getByTestId("auth.login.form.submit").click();

  // Wait for navigation away from login page or check for rate limit error
  let navigationSucceeded = false;
  let attempts = 0;
  const maxAttempts = 3;

  while (!navigationSucceeded && attempts < maxAttempts) {
    try {
      await page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 5000 });
      navigationSucceeded = true;
    } catch (error) {
      // Check if we're still on login page due to rate limiting
      const stillOnLogin = page.url().includes("/auth/login");
      const rateLimitError = (await page.locator('div[role="alert"]:has-text("Too many requests")').count()) > 0;

      if (stillOnLogin && rateLimitError) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error("Login failed due to rate limiting after multiple attempts");
        }
        // Wait longer before retrying
        await sleep(3000);
        await page.getByTestId("auth.login.form.submit").click();
      } else {
        throw error;
      }
    }
  }

  // Handle potential chunk loading errors in dev mode by reloading
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      // Check if there's a Next.js error overlay
      const errorOverlay = await page.locator('dialog[role="dialog"]').count();
      if (errorOverlay > 0) {
        // Reload the page to fix chunk loading issues
        await page.reload({ waitUntil: "networkidle" });
      }

      // Wait for sidebar to be visible
      await page.waitForSelector("data-testid=app.sidebar.user-menu-trigger", {
        state: "visible",
        timeout: 15000,
      });
      break; // Success, exit loop
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      // Reload and retry
      await page.reload({ waitUntil: "networkidle" });
    }
  }
}

export async function logoutUser(page: Page) {
  // Wait for the page to be fully loaded
  await page.waitForLoadState("networkidle");

  let menuOpened = false;
  let attempts = 0;
  const maxAttempts = 3;

  while (!menuOpened && attempts < maxAttempts) {
    try {
      // Click the user menu trigger
      const menuTrigger = page.getByTestId("app.sidebar.user-menu-trigger");
      await menuTrigger.waitFor({ state: "visible" });
      await menuTrigger.click();

      // Wait a brief moment for the dropdown animation
      await sleep(500);

      // Wait for dropdown menu to be visible
      await page.waitForSelector("data-testid=app.sign-out", { state: "visible", timeout: 5000 });
      menuOpened = true;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error(`Failed to open user menu after ${maxAttempts} attempts: ${error}`);
      }
      // Click outside to close any partially opened menu, then retry
      await page.mouse.click(100, 100);
      await sleep(500);
    }
  }

  // Click the sign out button
  const signOutButton = page.getByTestId("app.sign-out");
  await signOutButton.click();

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

export { smtpServerApi };
