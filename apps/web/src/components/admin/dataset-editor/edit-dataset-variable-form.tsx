"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { update } from "@/actions/dataset-variable";
import { MissingRangesEditor } from "@/components/form/missing-ranges-editor";
import { TextArrayEditor } from "@/components/form/text-array-editor";
import { DatasetVariableLabel, VariableLabelsEditor } from "@/components/form/variable-labels-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatasetVariable, updateDatasetVariableSchema } from "@/types/dataset-variable";

// Define the allowed measure values
const MEASURE_OPTIONS = ["nominal", "ordinal", "scale", "unknown"] as const;

// Define the form schema
const formSchema = z.object({
  id: z.uuid(),
  label: z.string().nullable(),
  measure: z.enum(MEASURE_OPTIONS),
  missingValues: z.array(z.string()).nullable().optional(),
  missingRanges: z
    .array(z.object({ lo: z.number(), hi: z.number() }))
    .nullable()
    .optional(),
  variableLabels: z
    .object({
      default: z.string().min(1),
      de: z.string().optional(),
      en: z.string().optional(),
    })
    .nullable()
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

type EditDatasetVariableFormProps = {
  datasetVariable: DatasetVariable;
};

export function EditDatasetVariableForm({ datasetVariable }: EditDatasetVariableFormProps) {
  const router = useRouter();
  const t = useTranslations("adminDatasetEditor");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: datasetVariable.id,
      label: datasetVariable.label,
      measure: datasetVariable.measure,
      missingValues: Array.isArray(datasetVariable.missingValues) ? (datasetVariable.missingValues as string[]) : null,
      missingRanges: datasetVariable.missingRanges?.[datasetVariable.name] ?? null,
      variableLabels: (datasetVariable.variableLabels as DatasetVariableLabel) ?? null,
    },
  });

  // Helper function to safely get field value
  const getFieldValue = (value: string | null | undefined): string => {
    return value ?? "";
  };

  const onSubmit = async (values: FormValues) => {
    // Transform missingRanges from array to record keyed by variable name
    const updateData = updateDatasetVariableSchema.parse({
      ...values,
      missingRanges: values.missingRanges ? { [datasetVariable.name]: values.missingRanges } : null,
    });
    try {
      setIsLoading(true);

      await update(datasetVariable.id, updateData);

      toast.success(t("editVariable.form.success"));
      router.refresh();
      router.push(`/admin/datasets/${datasetVariable.datasetId}/editor`);
    } catch (error) {
      console.error("Error updating dataset variable:", error);
      toast.error(t("editVariable.form.errors.updateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <Field>
            <FieldLabel>{t("editVariable.form.name.label")}</FieldLabel>
            <FieldGroup>
              <Input value={getFieldValue(datasetVariable.name)} disabled />
            </FieldGroup>
          </Field>

          <Controller
            name="label"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="label">{t("editVariable.form.label.label")}</FieldLabel>
                <FieldGroup>
                  <Input
                    id="label"
                    placeholder={t("editVariable.form.label.placeholder")}
                    aria-invalid={fieldState.invalid}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FieldGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="variableLabels"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>{t("editVariable.form.variableLabels.label")}</FieldLabel>
                <FieldGroup>
                  <VariableLabelsEditor value={field.value ?? null} onChange={field.onChange} />
                </FieldGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="missingValues"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>{t("editVariable.form.missingValues.label")}</FieldLabel>
                <FieldGroup>
                  <TextArrayEditor value={field.value ?? []} onChange={field.onChange} />
                </FieldGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="missingRanges"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>{t("editVariable.form.missingRanges.label")}</FieldLabel>
                <FieldGroup>
                  <MissingRangesEditor value={field.value ?? []} onChange={field.onChange} />
                </FieldGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Field>
            <FieldLabel>{t("editVariable.form.type.label")}</FieldLabel>
            <FieldGroup>
              <Input value={datasetVariable.type} disabled />
            </FieldGroup>
          </Field>

          <Controller
            name="measure"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="measure">{t("editVariable.form.measure.label")}</FieldLabel>
                <FieldGroup>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="measure" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEASURE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(`editVariable.form.measure.options.${option}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <div className="flex justify-start gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/datasets/${datasetVariable.datasetId}/editor`)}
            className="cursor-pointer"
            disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading} className="cursor-pointer">
            {isLoading ? t("common.saving") : t("common.saveChanges")}
          </Button>
        </div>
      </form>
    </div>
  );
}
