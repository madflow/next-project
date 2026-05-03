import { organizationThemeColorKeys, organizationThemeColorSchema } from "@repo/database/schema";

export { organizationThemeColorKeys };

export function normalizeThemeColorInput(value: string) {
  return value.trim().toLowerCase();
}

export function isValidThemeColor(value: string) {
  return organizationThemeColorSchema.safeParse(value).success;
}

export function sanitizeThemeChartColors(chartColors?: Record<string, string> | null) {
  if (!chartColors) {
    return undefined;
  }

  const sanitizedEntries = organizationThemeColorKeys.flatMap((key) => {
    const value = chartColors[key];
    const parsedValue = organizationThemeColorSchema.safeParse(value);
    return parsedValue.success ? [[key, parsedValue.data] as const] : [];
  });

  if (sanitizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(sanitizedEntries);
}
