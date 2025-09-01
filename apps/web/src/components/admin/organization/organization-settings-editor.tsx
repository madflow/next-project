"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Types from database schema
type ThemeItem = {
  name: string;
  chartColors?: Record<string, string>;
};

type OrganizationSettings = {
  themes?: ThemeItem[];
};

type OrganizationSettingsEditorProps = {
  initialSettings?: OrganizationSettings;
  onChangeAction?: (settings: OrganizationSettings) => void;
  readOnly?: boolean;
};

const defaultChartColors: Record<string, string> = {
  "chart-1": "#3b82f6",
  "chart-2": "#ef4444", 
  "chart-3": "#10b981",
  "chart-4": "#f59e0b",
  "chart-5": "#8b5cf6",
  "chart-6": "#ec4899",
};

const getDefaultOrganizationSettings = (): OrganizationSettings => ({
  themes: [
    {
      name: "Default",
      chartColors: { ...defaultChartColors },
    },
  ],
});

export function OrganizationSettingsEditor({
  initialSettings,
  onChangeAction,
  readOnly = false,
}: OrganizationSettingsEditorProps) {
  const t = useTranslations();
  const [themes, setThemes] = useState<ThemeItem[]>(
    initialSettings?.themes || getDefaultOrganizationSettings().themes || []
  );

  const updateSettings = (newThemes: ThemeItem[]) => {
    setThemes(newThemes);
    onChangeAction?.({ themes: newThemes });
  };

  const addTheme = () => {
    const newTheme: ThemeItem = {
      name: `${t("organization.settings.theme.newTheme")} ${themes.length + 1}`,
      chartColors: { ...defaultChartColors },
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
      updateTheme(index, { ...theme, name });
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
          <p className="text-sm text-muted-foreground">
            {t("organization.settings.description")}
          </p>
        </div>
        {!readOnly && (
          <Button onClick={addTheme} size="sm" className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
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
                    <Input
                      value={theme.name}
                      onChange={(e) => updateThemeName(themeIndex, e.target.value)}
                      placeholder={t("organization.settings.theme.namePlaceholder")}
                      className="max-w-xs"
                    />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {colorKeys.map((colorKey) => {
                  const currentColor = theme.chartColors?.[colorKey] || defaultChartColors[colorKey];
                  return (
                    <div key={colorKey} className="space-y-2">
                      <Label htmlFor={`${themeIndex}-${colorKey}`} className="text-sm font-medium">
                        {t(`organization.settings.chart.${colorKey}` as any)}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <input
                          id={`${themeIndex}-${colorKey}`}
                          type="color"
                          value={currentColor}
                          onChange={(e) => updateThemeColor(themeIndex, colorKey, e.target.value)}
                          disabled={readOnly}
                          className="h-8 w-8 rounded border border-input cursor-pointer disabled:cursor-not-allowed"
                        />
                        <Input
                          value={currentColor}
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
            <p className="text-muted-foreground">
              {t("organization.settings.theme.empty")}
            </p>
            {!readOnly && (
              <Button onClick={addTheme} className="mt-4 cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                {t("organization.settings.theme.addFirst")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}