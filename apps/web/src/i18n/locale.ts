"use server";

import { cookies, headers } from "next/headers";
import { COOKIE_NAME, Locale, defaultLocale } from "@/i18n/config";
import { auth } from "@/lib/auth";

// In this example the locale is read from a cookie. You could alternatively
// also read it from a database, backend service, or any other source.

export async function getUserLocale(): Promise<Locale> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user?.locale) {
    return session.user.locale as Locale;
  }
  return ((await cookies()).get(COOKIE_NAME)?.value as Locale) || (defaultLocale as Locale);
}

export async function setUserLocale(locale: Locale) {
  (await cookies()).set(COOKIE_NAME, locale);
}

