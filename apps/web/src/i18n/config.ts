export type Locale = (typeof locales)[number];

export const locales = ["en", "de"] as const;
export const defaultLocale: Locale = "en";

export const COOKIE_NAME = "APP_LOCALE";

export function extractAppLocale(str: string): Locale | null {
  const pairs = str.split(";").map((pair) => pair.trim());
  for (const pair of pairs) {
    if (pair.startsWith("APP_LOCALE=")) {
      return pair.split("=")[1] as Locale;
    }
  }
  return null;
}
