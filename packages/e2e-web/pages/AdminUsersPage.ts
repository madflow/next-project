import { Page, expect } from "@playwright/test";

export class AdminUsersPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/admin/users");
  }

  async gotoCreate() {
    await this.page.goto("/admin/users/new");
  }

  async createUser(name: string, email: string) {
    await expect(this.page.getByTestId("admin.users.new.page")).toBeVisible();
    await this.page.getByTestId("admin.users.new.form.name").fill(name);
    await this.page.getByTestId("admin.users.new.form.email").fill(email);
    await this.page.getByTestId("admin.users.new.form.submit").click();
  }

  async searchUser(email: string) {
    await this.page.getByRole("textbox", { name: "Search" }).fill(email);
    await expect(this.page.getByTestId(`admin.users.list.edit-${email}`)).toBeVisible();
  }

  async editUser(email: string) {
    await this.page.getByTestId(`admin.users.list.edit-${email}`).click();
    await expect(this.page.getByTestId("admin.users.edit.page")).toBeVisible();
  }

  async updateUser(name: string, email: string) {
    await this.page.getByTestId("admin.users.edit.form.name").fill(name);
    await this.page.getByTestId("admin.users.edit.form.email").fill(email);
    await this.page.getByTestId("admin.users.edit.form.submit").click();
  }

  async verifyUserVisible(email: string) {
    await expect(this.page.getByTestId(`admin.users.list.edit-${email}`)).toBeVisible();
  }

  async verifyPageVisible() {
    await expect(this.page.getByTestId("admin.users.page")).toBeVisible();
  }
}
