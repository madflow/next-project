"use client";

import { useTranslations } from "next-intl";
import { useThemeConfig } from "@/components/active-theme";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import { useOrganizationTheme } from "@/context/organization-theme-context";
import { cn } from "@/lib/utils";

const DEFAULT_THEMES = [
  {
    name: "Default",
    value: "default",
  },
  {
    name: "Scaled",
    value: "scaled",
  },
  {
    name: "Mono",
    value: "mono",
  },
];

const COLOR_THEMES = [
  {
    name: "Blue",
    value: "blue",
    exampleClassName: "bg-blue-500",
  },
  {
    name: "Green",
    value: "green",
    exampleClassName: "bg-green-500",
  },
  {
    name: "Amber",
    value: "amber",
    exampleClassName: "bg-amber-500",
  },
  {
    name: "Rose",
    value: "rose",
    exampleClassName: "bg-rose-500",
  },
  {
    name: "Purple",
    value: "purple",
    exampleClassName: "bg-purple-500",
  },
  {
    name: "Orange",
    value: "orange",
    exampleClassName: "bg-orange-500",
  },
  {
    name: "Teal",
    value: "teal",
    exampleClassName: "bg-teal-500",
  },
];

export type ThemeSelectorProps = React.ComponentProps<"div">;

export function ThemeSelector({ ...props }: ThemeSelectorProps) {
  const t = useTranslations("themeSelector");
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const { availableThemes } = useOrganizationTheme();

  // Get organization-specific themes (exclude the default ones that are duplicated)
  const organizationThemes = availableThemes.filter((theme) => {
    const isDefaultTheme = DEFAULT_THEMES.some(
      (defaultTheme) => defaultTheme.name.toLowerCase() === theme.name.toLowerCase()
    );
    return !isDefaultTheme;
  });

  // Helper function to get display colors for org themes
  const getThemeColors = (theme: (typeof organizationThemes)[0]) => {
    if (!theme.chartColors) return null;
    const colors = Object.values(theme.chartColors).slice(0, 3);
    return colors.length > 0 ? colors : null;
  };

  // Helper function to get the display name for the selected theme
  const getSelectedThemeName = () => {
    // Check default themes
    const defaultTheme = DEFAULT_THEMES.find((theme) => theme.value === activeTheme);
    if (defaultTheme) return defaultTheme.name;

    // Check color themes
    const colorTheme = COLOR_THEMES.find((theme) => theme.value === activeTheme);
    if (colorTheme) return colorTheme.name;

    // Check organization themes
    const orgTheme = organizationThemes.find((theme) => theme.name.toLowerCase() === activeTheme);
    if (orgTheme) return orgTheme.name;

    return null;
  };

  return (
    <div className={cn("flex w-full items-center gap-2", props.className)}>
      <Label htmlFor="theme-selector" className="sr-only">
        {t("label")}
      </Label>
      <Select value={activeTheme} onValueChange={setActiveTheme}>
        <SelectTrigger id="theme-selector" className="w-full">
          <div className="flex justify-start gap-2">
            <span className="font-light">{t("labelSelect")}</span>
            <span>{getSelectedThemeName() || t("placeholder")}</span>
          </div>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            {DEFAULT_THEMES.map((theme) => (
              <SelectItem key={theme.name} value={theme.value} className="data-[state=checked]:opacity-50">
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>{t("colorThemes")}</SelectLabel>
            {COLOR_THEMES.map((theme) => (
              <SelectItem key={theme.name} value={theme.value} className="data-[state=checked]:opacity-50">
                <div className="flex items-center gap-2">
                  <div className={cn("h-3 w-3 rounded-full", theme.exampleClassName)} />
                  {theme.name}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
          {organizationThemes.length > 0 && (
            <>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>{t("organizationThemes")}</SelectLabel>
                {organizationThemes.map((theme) => {
                  const colors = getThemeColors(theme);
                  return (
                    <SelectItem
                      key={theme.name}
                      value={theme.name.toLowerCase()}
                      className="data-[state=checked]:opacity-50">
                      <div className="flex items-center gap-2">
                        {colors && (
                          <div className="flex gap-1">
                            {colors.map((color, index) => (
                              <div
                                key={index}
                                className="h-3 w-3 rounded-full border border-gray-200"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        )}
                        {theme.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
