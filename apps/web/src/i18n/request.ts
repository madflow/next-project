import { getRequestConfig } from "next-intl/server";
import { getUserLocale } from "./locale";

export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  const messages = {
    ...(await import(`../../messages/${locale}/auth.login.json`)).default,
    ...(await import(`../../messages/${locale}/auth.forgot-password.json`)).default,
    ...(await import(`../../messages/${locale}/auth.sign-up.json`)).default,
    ...(await import(`../../messages/${locale}/auth.reset-password.json`)).default,
    ...(await import(`../../messages/${locale}/app.account.json`)).default,
    ...(await import(`../../messages/${locale}/app.admin.organizations.json`)).default,
    ...(await import(`../../messages/${locale}/app.admin.organizations.members.json`)).default,
    ...(await import(`../../messages/${locale}/app.admin.users.json`)).default,
    ...(await import(`../../messages/${locale}/app.datatable.json`)).default,
    ...(await import(`../../messages/${locale}/app.admin.projects.json`)).default,
    ...(await import(`../../messages/${locale}/app.nav-user.json`)).default,
    ...(await import(`../../messages/${locale}/app.admin-sidebar.json`)).default,
    ...(await import(`../../messages/${locale}/app.app-sidebar.json`)).default,
    ...(await import(`../../messages/${locale}/app.locale-switcher.json`)).default,
    ...(await import(`../../messages/${locale}/app.admin.dashboard.json`)).default,
    ...(await import(`../../messages/${locale}/app.admin.datasets.json`)).default,
    ...(await import(`../../messages/${locale}/app.admin.dataset-editor.json`)).default,
  };
  return {
    locale,
    messages,
    timeZone: "UTC",
  };
});
