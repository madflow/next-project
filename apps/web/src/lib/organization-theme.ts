import {
  organizationThemeColorKeys,
  organizationThemeColorSchema,
  organizationThemePaletteCountKeys,
  themeChartColorsSchema,
} from "@repo/database/schema";
import type { ThemeChartColorPalettes, ThemeChartColors, ThemeItem } from "@/types/organization";

export { organizationThemeColorKeys, organizationThemePaletteCountKeys };

const MAX_THEME_COLOR_COUNT = organizationThemeColorKeys.length;

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

export function getThemeColorKeysForCount(count: number) {
  const safeCount = Math.max(1, Math.min(MAX_THEME_COLOR_COUNT, count));
  return organizationThemeColorKeys.slice(0, safeCount);
}

export function sanitizeThemeChartColorPalettes(chartColorPalettes?: ThemeChartColorPalettes | null) {
  if (!chartColorPalettes) {
    return undefined;
  }

  const sanitizedEntries = organizationThemePaletteCountKeys.flatMap((countKey) => {
    const parsedPalette = themeChartColorsSchema.safeParse(chartColorPalettes[countKey]);
    return parsedPalette.success ? [[countKey, parsedPalette.data] as const] : [];
  });

  if (sanitizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(sanitizedEntries) as ThemeChartColorPalettes;
}

function sanitizeThemePaletteColorValue(value?: string | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalizedValue = normalizeThemeColorInput(value);
  return isValidThemeColor(normalizedValue) ? normalizedValue : undefined;
}

export function sanitizeThemesPayload(themes: ThemeItem[], previousThemes?: ThemeItem[]) {
  return themes.map((theme, index) => {
    const previousTheme = previousThemes?.[index];
    const sanitizedPalettes = organizationThemePaletteCountKeys.flatMap((countKey) => {
      const currentPalette = theme.chartColorPalettes?.[countKey];
      if (!currentPalette) {
        return [];
      }

      const previousPalette = previousTheme?.chartColorPalettes?.[countKey];
      const sanitizedPaletteEntries = organizationThemeColorKeys.flatMap((colorKey) => {
        const sanitizedCurrentValue = sanitizeThemePaletteColorValue(currentPalette[colorKey]);
        if (sanitizedCurrentValue) {
          return [[colorKey, sanitizedCurrentValue] as const];
        }

        const sanitizedPreviousValue = sanitizeThemePaletteColorValue(previousPalette?.[colorKey]);
        return sanitizedPreviousValue ? [[colorKey, sanitizedPreviousValue] as const] : [];
      });

      return sanitizedPaletteEntries.length > 0
        ? [[countKey, Object.fromEntries(sanitizedPaletteEntries) as ThemeChartColors] as const]
        : [];
    });

    return {
      ...theme,
      chartColorPalettes:
        sanitizedPalettes.length > 0 ? (Object.fromEntries(sanitizedPalettes) as ThemeChartColorPalettes) : undefined,
    };
  });
}

function createPaletteFromChartColors(chartColors?: ThemeChartColors | null, count: number = MAX_THEME_COLOR_COUNT) {
  return getThemeColorKeysForCount(count).reduce<ThemeChartColors>((palette, colorKey) => {
    const color = chartColors?.[colorKey];
    if (color) {
      palette[colorKey] = color;
    }
    return palette;
  }, {});
}

function repeatThemeColorAcrossPalette(color?: string | null) {
  if (!color) {
    return {};
  }

  return organizationThemeColorKeys.reduce<ThemeChartColors>((palette, colorKey) => {
    palette[colorKey] = color;
    return palette;
  }, {});
}

function getThemePaletteCountKey(count: number) {
  if (!Number.isFinite(count)) {
    return undefined;
  }

  const safeCount = Math.trunc(count);
  if (safeCount < 1 || safeCount > MAX_THEME_COLOR_COUNT) {
    return undefined;
  }

  return String(safeCount) as (typeof organizationThemePaletteCountKeys)[number];
}

export function resolveThemePaletteForCount(
  theme: Pick<ThemeItem, "chartColors" | "chartColorPalettes">,
  count: number
) {
  const countKey = getThemePaletteCountKey(count);
  const paletteKeys = getThemeColorKeysForCount(count);
  const configuredPalette = countKey ? sanitizeThemeChartColors(theme.chartColorPalettes?.[countKey]) : undefined;
  const fallbackPalette = createPaletteFromChartColors(sanitizeThemeChartColors(theme.chartColors), paletteKeys.length);

  return paletteKeys.reduce<ThemeChartColors>((resolvedPalette, colorKey, index) => {
    const fallbackColorKey = organizationThemeColorKeys[index];
    if (!fallbackColorKey) {
      return resolvedPalette;
    }

    const color = configuredPalette?.[colorKey] ?? fallbackPalette[colorKey] ?? theme.chartColors?.[fallbackColorKey];
    if (color) {
      resolvedPalette[colorKey] = color;
    }
    return resolvedPalette;
  }, {});
}

export function withResolvedThemePalettes(theme: ThemeItem): ThemeItem {
  const chartColors = sanitizeThemeChartColors(theme.chartColors);
  const configuredPalettes = sanitizeThemeChartColorPalettes(theme.chartColorPalettes);

  const chartColorPalettes = organizationThemePaletteCountKeys.reduce<ThemeChartColorPalettes>((palettes, countKey) => {
    const palette = resolveThemePaletteForCount(
      { chartColors, chartColorPalettes: configuredPalettes },
      Number(countKey)
    );
    if (Object.keys(palette).length > 0) {
      palettes[countKey] = palette;
    }
    return palettes;
  }, {});

  return {
    ...theme,
    chartColors,
    chartColorPalettes: Object.keys(chartColorPalettes).length > 0 ? chartColorPalettes : undefined,
  };
}

export function resolveSingleSeriesThemeChartColors(theme: Pick<ThemeItem, "chartColors" | "chartColorPalettes">) {
  const singleSeriesPalette = resolveThemePaletteForCount(theme, 1);
  return repeatThemeColorAcrossPalette(singleSeriesPalette["chart-1"] ?? theme.chartColors?.["chart-1"]);
}
