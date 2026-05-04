"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getThemeColorKeysForCount,
  isValidThemeColor,
  normalizeThemeColorInput,
  organizationThemeColorKeys,
  organizationThemePaletteCountKeys,
  resolveThemePaletteForCount,
} from "@/lib/organization-theme";
import { type OrganizationSettings, type ThemeChartColors, ThemeItem } from "@/types/organization";
import { DEFAULT_THEME } from "./defaults";

type OrganizationSettingsEditorProps = {
  initialSettings?: OrganizationSettings | null;
  onChangeAction: (settings: OrganizationSettings) => void;
  readOnly?: boolean;
};

export function OrganizationSettingsEditor({
  initialSettings,
  onChangeAction,
  readOnly = false,
}: OrganizationSettingsEditorProps) {
  const t = useTranslations();
  const [themes, setThemes] = useState<ThemeItem[]>(initialSettings?.themes || [DEFAULT_THEME] || []);
  const [invalidColorFields, setInvalidColorFields] = useState<Record<string, boolean>>({});

  const updateSettings = (newThemes: ThemeItem[]) => {
    setThemes(newThemes);
    onChangeAction({ themes: newThemes });
  };

  const addTheme = () => {
    const newTheme: ThemeItem = {
      name: `new-theme-${themes.length + 1}`,
      chartColors: { ...DEFAULT_THEME.chartColors },
      chartColorPalettes: {},
    };
    updateSettings([...themes, newTheme]);
  };

  const removeTheme = (index: number) => {
    updateSettings(themes.filter((_, i) => i !== index));
  };

  const updateTheme = (index: number, updatedTheme: ThemeItem) => {
    const newThemes = [...themes];
    newThemes[index] = updatedTheme;
    updateSettings(newThemes);
  };

  const updateThemeName = (index: number, name: string) => {
    const theme = themes[index];
    if (theme) {
      // Allow A-Za-z0-9, hyphens, and underscores. Replace spaces with hyphens and remove other invalid characters
      const sanitizedName = name
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/[^A-Za-z0-9\-_]/g, ""); // Remove any characters that aren't A-Za-z0-9, -, or _
      updateTheme(index, { ...theme, name: sanitizedName });
    }
  };

  const updateThemeColor = (index: number, colorKey: string, color: string) => {
    const theme = themes[index];
    if (theme) {
      const currentColors = theme.chartColors || {};
      const normalizedColor = normalizeThemeColorInput(color);
      const fieldId = `${index}-${colorKey}`;
      const isValid = isValidThemeColor(normalizedColor);
      const nextColorValue = isValid ? normalizedColor : color;
      const nextThemes = [...themes];
      nextThemes[index] = {
        ...theme,
        chartColors: { ...currentColors, [colorKey]: nextColorValue },
      };
      setThemes(nextThemes);

      setInvalidColorFields((current) => {
        if (isValid) {
          const next = { ...current };
          delete next[fieldId];
          return next;
        }

        return { ...current, [fieldId]: true };
      });

      if (!isValid) {
        return;
      }

      onChangeAction({
        themes: nextThemes.map((nextTheme, themeIndex) =>
          themeIndex === index
            ? {
                ...nextTheme,
                chartColors: {
                  ...nextTheme.chartColors,
                  [colorKey]: normalizedColor,
                },
              }
            : nextTheme
        ),
      });
    }
  };

  const updateThemePaletteColor = (index: number, paletteCountKey: string, colorKey: string, color: string) => {
    const theme = themes[index];
    if (!theme) {
      return;
    }

    const normalizedColor = normalizeThemeColorInput(color);
    const fieldId = `${index}-${paletteCountKey}-${colorKey}`;
    const isValid = isValidThemeColor(normalizedColor);
    const nextColorValue = isValid ? normalizedColor : color;
    const currentPalette = theme.chartColorPalettes?.[paletteCountKey as keyof NonNullable<ThemeItem["chartColorPalettes"]>] || {};
    const nextThemes = [...themes];
    nextThemes[index] = {
      ...theme,
      chartColorPalettes: {
        ...theme.chartColorPalettes,
        [paletteCountKey]: {
          ...currentPalette,
          [colorKey]: nextColorValue,
        },
      },
    };
    setThemes(nextThemes);

    setInvalidColorFields((current) => {
      if (isValid) {
        const next = { ...current };
        delete next[fieldId];
        return next;
      }

      return { ...current, [fieldId]: true };
    });

    if (!isValid) {
      return;
    }

    onChangeAction({ themes: nextThemes });
  };

  const colorKeys = organizationThemeColorKeys;

  const getBaseColorValue = (theme: ThemeItem, colorKey: (typeof organizationThemeColorKeys)[number]) => {
    const currentColor = theme.chartColors?.[colorKey] || DEFAULT_THEME.chartColors?.[colorKey];
    const normalizedColor = normalizeThemeColorInput(currentColor ?? "");
    const safeColorValue = isValidThemeColor(normalizedColor)
      ? normalizedColor
      : (DEFAULT_THEME.chartColors?.[colorKey] ?? "#000000");

    return { currentColor, safeColorValue };
  };

  const getPaletteColorValue = (
    theme: ThemeItem,
    paletteCount: number,
    paletteCountKey: string,
    colorKey: (typeof organizationThemeColorKeys)[number]
  ) => {
    const resolvedPalette = resolveThemePaletteForCount(theme, paletteCount);
    const explicitPalette = theme.chartColorPalettes?.[
      paletteCountKey as keyof NonNullable<ThemeItem["chartColorPalettes"]>
    ] as ThemeChartColors | undefined;
    const currentColor = explicitPalette?.[colorKey] ?? resolvedPalette[colorKey] ?? DEFAULT_THEME.chartColors?.[colorKey];
    const normalizedColor = normalizeThemeColorInput(currentColor ?? "");
    const safeColorValue = isValidThemeColor(normalizedColor)
      ? normalizedColor
      : (DEFAULT_THEME.chartColors?.[colorKey] ?? "#000000");

    return {
      currentColor,
      safeColorValue,
      isDerived: explicitPalette?.[colorKey] === undefined,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t("organization.settings.title")}</h3>
          <p className="text-muted-foreground text-sm">{t("organization.settings.description")}</p>
        </div>
        {!readOnly && (
          <Button onClick={addTheme} size="sm" className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            {t("organization.settings.theme.add")}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {themes.map((theme, themeIndex) => (
          <Card key={themeIndex}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {readOnly ? (
                    theme.name
                  ) : (
                    <div className="space-y-1">
                      <Input
                        value={theme.name}
                        onChange={(e) => updateThemeName(themeIndex, e.target.value)}
                        placeholder={t("organization.settings.theme.namePlaceholder")}
                        className="max-w-xs"
                        data-testid={`theme-name-${themeIndex}`}
                      />
                      <p className="text-muted-foreground text-xs">{t("organization.settings.theme.nameHelp")}</p>
                    </div>
                  )}
                </CardTitle>
                {!readOnly && themes.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeTheme(themeIndex)}
                    className="cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium">{t("organization.settings.theme.basePalette.title")}</h4>
                    <p className="text-muted-foreground text-xs">{t("organization.settings.theme.basePalette.description")}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {colorKeys.map((colorKey) => {
                      const { currentColor, safeColorValue } = getBaseColorValue(theme, colorKey);
                      const isInvalid = invalidColorFields[`${themeIndex}-${colorKey}`] === true;

                      return (
                        <div key={colorKey} className="space-y-2">
                          <Label htmlFor={`${themeIndex}-${colorKey}`} className="text-sm font-medium">
                            {colorKey}
                          </Label>
                          <div className="flex items-center space-x-2">
                            <input
                              id={`${themeIndex}-${colorKey}`}
                              type="color"
                              value={safeColorValue}
                              onChange={(e) => updateThemeColor(themeIndex, colorKey, e.target.value)}
                              disabled={readOnly}
                              className="border-input h-8 w-8 cursor-pointer rounded border disabled:cursor-not-allowed"
                            />
                            <Input
                              value={currentColor}
                              data-testid={`theme-color-${themeIndex}-${colorKey}`}
                              onChange={(e) => updateThemeColor(themeIndex, colorKey, e.target.value)}
                              placeholder="#000000"
                              pattern="^#[0-9A-Fa-f]{6}$"
                              aria-invalid={isInvalid}
                              className="flex-1 font-mono text-sm"
                              readOnly={readOnly}
                            />
                          </div>
                          {isInvalid && (
                            <p className="text-destructive text-xs">{t("organization.settings.theme.colorHelp")}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div>
                    <h4 className="text-sm font-medium">{t("organization.settings.theme.countPalettes.title")}</h4>
                    <p className="text-muted-foreground text-xs">
                      {t("organization.settings.theme.countPalettes.description")}
                    </p>
                  </div>
                  {organizationThemePaletteCountKeys.map((paletteCountKey) => {
                    const paletteCount = Number(paletteCountKey);
                    const paletteKeys = getThemeColorKeysForCount(paletteCount);

                    return (
                      <div key={paletteCountKey} className="space-y-3 rounded-md border p-4">
                        <div>
                          <h5 className="text-sm font-medium">
                            {t("organization.settings.theme.countPalettes.paletteTitle", { count: paletteCount })}
                          </h5>
                          <p className="text-muted-foreground text-xs">
                            {paletteCount === 1
                              ? t("organization.settings.theme.countPalettes.singleSeriesDescription")
                              : t("organization.settings.theme.countPalettes.multiSeriesDescription", {
                                  count: paletteCount,
                                })}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {paletteKeys.map((colorKey) => {
                            const { currentColor, safeColorValue, isDerived } = getPaletteColorValue(
                              theme,
                              paletteCount,
                              paletteCountKey,
                              colorKey
                            );
                            const isInvalid = invalidColorFields[`${themeIndex}-${paletteCountKey}-${colorKey}`] === true;

                            return (
                              <div key={`${paletteCountKey}-${colorKey}`} className="space-y-2">
                                <Label htmlFor={`${themeIndex}-${paletteCountKey}-${colorKey}`} className="text-sm font-medium">
                                  {colorKey}
                                </Label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    id={`${themeIndex}-${paletteCountKey}-${colorKey}`}
                                    type="color"
                                    value={safeColorValue}
                                    onChange={(e) =>
                                      updateThemePaletteColor(themeIndex, paletteCountKey, colorKey, e.target.value)
                                    }
                                    disabled={readOnly}
                                    className="border-input h-8 w-8 cursor-pointer rounded border disabled:cursor-not-allowed"
                                  />
                                  <Input
                                    value={currentColor}
                                    data-testid={`theme-palette-color-${themeIndex}-${paletteCountKey}-${colorKey}`}
                                    onChange={(e) =>
                                      updateThemePaletteColor(themeIndex, paletteCountKey, colorKey, e.target.value)
                                    }
                                    placeholder="#000000"
                                    pattern="^#[0-9A-Fa-f]{6}$"
                                    aria-invalid={isInvalid}
                                    className="flex-1 font-mono text-sm"
                                    readOnly={readOnly}
                                  />
                                </div>
                                {isDerived && !isInvalid && (
                                  <p className="text-muted-foreground text-xs">
                                    {t("organization.settings.theme.countPalettes.derivedHelp")}
                                  </p>
                                )}
                                {isInvalid && (
                                  <p className="text-destructive text-xs">{t("organization.settings.theme.colorHelp")}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {themes.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{t("organization.settings.theme.empty")}</p>
            {!readOnly && (
              <Button onClick={addTheme} className="mt-4 cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                {t("organization.settings.theme.addFirst")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
