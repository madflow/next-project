import { Page, expect } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async login(email: string, password: string) {
    await this.page.waitForSelector("data-testid=auth.login.form.email");
    await this.page.getByTestId("auth.login.form.email").fill(email);
    await this.page.getByTestId("auth.login.form.password").fill(password);

    const getSessionResponse = this.page.waitForResponse(
      (response) => response.url().includes("/api/auth/get-session") && response.status() === 200
    );
    await this.page.getByTestId("auth.login.form.submit").click();

    await getSessionResponse;

    await expect(this.page.getByTestId("app.sidebar.user-menu-trigger")).toBeVisible();
  }
}
