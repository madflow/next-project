"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Locale } from "@/i18n/config";
import { setUserLocale } from "@/i18n/locale";

type LocaleSwitcherProps = {
  defaultValue: Locale;
};

export function LocaleSwitcher({ defaultValue }: LocaleSwitcherProps) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("localeSwitcher");

  const selectedLabel = defaultValue === "de" ? t("languages.de") : t("languages.en");

  function onChange(value: string | null) {
    if (!value) {
      return;
    }

    const locale = value as Locale;
    startTransition(() => {
      setUserLocale(locale);
    });
  }

  return (
    <Select value={defaultValue} onValueChange={onChange}>
      <SelectTrigger data-testid="app.locale-switcher">
        <SelectValue placeholder={t("selectLanguage")}>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup className={isPending ? "pointer-events-none opacity-60" : ""}>
          <SelectLabel>{t("locale")}</SelectLabel>
          <SelectItem value="en">{t("languages.en")}</SelectItem>
          <SelectItem value="de">{t("languages.de")}</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
