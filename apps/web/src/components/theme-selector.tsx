"use client";

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
  SelectValue,
} from "@/components/ui/select";
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

export type ThemeSelectorProps = {
  label?: string;
  placeholder?: string;
} & React.ComponentProps<"div">;

export function ThemeSelector({ label = "Theme", placeholder = "Select a theme", className }: ThemeSelectorProps) {
  const { activeTheme, setActiveTheme } = useThemeConfig();

  return (
    <div className={cn("flex w-full items-center gap-2", className)}>
      <Label htmlFor="theme-selector" className="sr-only">
        {label}
      </Label>
      <Select value={activeTheme} onValueChange={setActiveTheme}>
        <SelectTrigger id="theme-selector" className="w-full">
          <div className="flex justify-start gap-2">
            <span className="font-light">{label}:</span>
            <SelectValue placeholder={placeholder} />
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
            <SelectLabel>Colors</SelectLabel>
            {COLOR_THEMES.map((theme) => (
              <SelectItem key={theme.name} value={theme.value} className="data-[state=checked]:opacity-50">
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
