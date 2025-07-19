import "@tanstack/react-table";
import { locales } from "@/i18n/config";
import appAccount from "../messages/en/app.account.json";
import appAdminSidebar from "../messages/en/app.admin-sidebar.json";
import appAdminDashboard from "../messages/en/app.admin.dashboard.json";
import adminDatasetEditor from "../messages/en/app.admin.dataset-editor.json";
import appAdminDatasets from "../messages/en/app.admin.datasets.json";
import appAdminDatasetVariable from "../messages/en/app.admin.dataset-variable.json";
import appAdminOrganizations from "../messages/en/app.admin.organizations.json";
import appAdminOrganizationsMembers from "../messages/en/app.admin.organizations.members.json";
import appAdminProjects from "../messages/en/app.admin.projects.json";
import appAdminUsers from "../messages/en/app.admin.users.json";
import appAppSidebar from "../messages/en/app.app-sidebar.json";
import appDatatable from "../messages/en/app.datatable.json";
import appLocaleSwitcher from "../messages/en/app.locale-switcher.json";
import appNavUser from "../messages/en/app.nav-user.json";
import authForgotPassword from "../messages/en/auth.forgot-password.json";
import authLogin from "../messages/en/auth.login.json";
import authResetPassword from "../messages/en/auth.reset-password.json";
import authSignUp from "../messages/en/auth.sign-up.json";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string;
  }
}

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: typeof appAccount &
      typeof appAdminDashboard &
      typeof adminDatasetEditor &
      typeof appAdminSidebar &
      typeof appAdminOrganizations &
      typeof appAdminOrganizationsMembers &
      typeof appAdminProjects &
      typeof appAdminUsers &
      typeof appAppSidebar &
      typeof appDatatable &
      typeof appLocaleSwitcher &
      typeof appNavUser &
      typeof adminDashboard &
      typeof authForgotPassword &
      typeof authLogin &
      typeof authResetPassword &
      typeof authSignUp &
      typeof appAdminDatasets &
      typeof appAdminDatasetVariable;
  }
}
