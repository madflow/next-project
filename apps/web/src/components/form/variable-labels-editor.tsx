"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type DatasetVariableLabel = {
  default: string;
  de?: string;
  en?: string;
};

type VariableLabelsEditorProps = {
  value: DatasetVariableLabel | null;
  onChange: (value: DatasetVariableLabel | null) => void;
};

type SupportedLocale = "de" | "en";

export function VariableLabelsEditor({ value, onChange }: VariableLabelsEditorProps) {
  const t = useTranslations("adminDatasetEditor");
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentValue: DatasetVariableLabel = value ?? { default: "" };

  const handleDefaultChange = (newDefault: string) => {
    if (!newDefault.trim()) {
      setValidationError(t("editVariable.form.variableLabels.validation.defaultRequired"));
      onChange({ ...currentValue, default: newDefault });
      return;
    }
    setValidationError(null);
    onChange({ ...currentValue, default: newDefault });
  };

  const handleTranslationChange = (locale: SupportedLocale, newValue: string) => {
    const updated = { ...currentValue };
    if (newValue.trim()) {
      updated[locale] = newValue;
    } else {
      delete updated[locale];
    }
    onChange(updated);
  };

  // Get all supported translation locales
  const translationLocales = (["de", "en"] as SupportedLocale[]).sort();

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <Field>
        <FieldLabel htmlFor="variableLabel-default">{t("editVariable.form.variableLabels.default")}</FieldLabel>
        <FieldGroup>
          <Input
            id="variableLabel-default"
            value={currentValue.default}
            onChange={(e) => handleDefaultChange(e.target.value)}
            placeholder={t("editVariable.form.variableLabels.placeholder.default")}
            required
          />
        </FieldGroup>
        {validationError && <p className="text-sm text-red-600">{validationError}</p>}
      </Field>

      <div className="space-y-3">
        <p className="text-sm font-medium">{t("editVariable.form.variableLabels.translations")}</p>

        {/* Always show all translation fields */}
        {translationLocales.map((locale) => (
          <Field key={locale}>
            <FieldLabel htmlFor={`variableLabel-${locale}`}>
              {t(`editVariable.form.variableLabels.locale.${locale}`)}
            </FieldLabel>
            <FieldGroup>
              <Input
                id={`variableLabel-${locale}`}
                value={currentValue[locale] ?? ""}
                onChange={(e) => handleTranslationChange(locale, e.target.value)}
                placeholder={t("editVariable.form.variableLabels.placeholder.translation", {
                  locale: t(`editVariable.form.variableLabels.locale.${locale}`),
                })}
              />
            </FieldGroup>
          </Field>
        ))}
      </div>
    </div>
  );
}
