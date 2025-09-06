"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type OrganizationSettings, ThemeItem } from "@/types/organization";
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

  const updateSettings = (newThemes: ThemeItem[]) => {
    setThemes(newThemes);
    onChangeAction({ themes: newThemes });
  };

  const addTheme = () => {
    const newTheme: ThemeItem = {
      name: `new-theme-${themes.length + 1}`,
      chartColors: { ...DEFAULT_THEME.chartColors },
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
      updateTheme(index, {
        ...theme,
        chartColors: { ...currentColors, [colorKey]: color },
      });
    }
  };

  const colorKeys = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6"];

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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {colorKeys.map((colorKey) => {
                  const currentColor = theme.chartColors?.[colorKey] || DEFAULT_THEME.chartColors?.[colorKey];
                  return (
                    <div key={colorKey} className="space-y-2">
                      <Label htmlFor={`${themeIndex}-${colorKey}`} className="text-sm font-medium">
                        {colorKey}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <input
                          id={`${themeIndex}-${colorKey}`}
                          type="color"
                          value={currentColor}
                          onChange={(e) => updateThemeColor(themeIndex, colorKey, e.target.value)}
                          disabled={readOnly}
                          className="border-input h-8 w-8 cursor-pointer rounded border disabled:cursor-not-allowed"
                        />
                        <Input
                          value={currentColor}
                          data-testid={`theme-color-${themeIndex}-${colorKey}`}
                          onChange={(e) => updateThemeColor(themeIndex, colorKey, e.target.value)}
                          placeholder="#000000"
                          className="flex-1 font-mono text-sm"
                          readOnly={readOnly}
                        />
                      </div>
                    </div>
                  );
                })}
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
