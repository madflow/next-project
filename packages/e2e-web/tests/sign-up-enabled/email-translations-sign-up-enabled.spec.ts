import { Page, expect, test } from "@playwright/test";
import { smtpServerApi } from "../../utils";

async function switchLocale(page: Page, language: "German" | "Englisch") {
  await page.getByTestId("app.locale-switcher").click();
  await page.getByRole("option", { name: language }).click();
}

async function getLatestEmail(email: string) {
  let tries = 0;
  const maxTries = 5;
  const delay = 1000; // 1 second

  while (tries < maxTries) {
    const searchMessages = await smtpServerApi.searchMessages({
      query: `to:"${email}"`,
    });
    if (searchMessages.messages.length > 0) {
      return searchMessages.messages[0];
    }
    tries++;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return null;
}

test.describe.configure({ mode: "parallel" });

test.describe("Email Translations", () => {
  test(
    "email verification email should be sent in English when locale is English",
    { tag: ["@sign-up-enabled"] },
    async ({ page }) => {
      const userEmail = `e2e-email-verify-en-${Date.now()}@example.com`;
      const password = crypto.randomUUID();

      await page.goto("/");

      await expect(page.locator("html")).toHaveAttribute("lang", "en");

      await page.goto("/auth/sign-up");
      await page.getByTestId("auth.sign-up.form.email").fill(userEmail);
      await page.getByTestId("auth.sign-up.form.password").fill(password);
      await page.getByTestId("auth.sign-up.form.confirm-password").fill(password);
      await page.getByTestId("auth.sign-up.form.name").fill("E2E User EN");
      // http://localhost:3000/api/auth/sign-up/email
      const signupResponsePromise = page.waitForResponse("api/auth/sign-up/email");
      await page.getByTestId("auth.sign-up.form.submit").click();
      await signupResponsePromise;

      const message = await getLatestEmail(userEmail);
      expect(message?.Subject).toBe("Email Verification");

      await smtpServerApi.deleteMessagesBySearch({ query: `to:"${userEmail}"` });
    }
  );

  test(
    "email verification email should be sent in German when locale is German",
    { tag: ["@sign-up-enabled"] },
    async ({ page }) => {
      const userEmail = `e2e-email-verify-de-${Date.now()}@example.com`;
      const password = crypto.randomUUID();

      await page.goto("/");

      await switchLocale(page, "German");
      await expect(page.locator("html")).toHaveAttribute("lang", "de");

      await page.goto("/auth/sign-up");
      await page.getByTestId("auth.sign-up.form.email").fill(userEmail);
      await page.getByTestId("auth.sign-up.form.password").fill(password);
      await page.getByTestId("auth.sign-up.form.confirm-password").fill(password);
      await page.getByTestId("auth.sign-up.form.name").fill("E2E User DE");

      const signupResponsePromise = page.waitForResponse("api/auth/sign-up/email");
      await page.getByTestId("auth.sign-up.form.submit").click();
      await signupResponsePromise;

      const message = await getLatestEmail(userEmail);
      expect(message?.Subject).toBe("E-Mail-Verifizierung");

      await smtpServerApi.deleteMessagesBySearch({ query: `to:"${userEmail}"` });
    }
  );
});
