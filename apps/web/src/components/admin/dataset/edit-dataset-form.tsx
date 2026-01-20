"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { update } from "@/actions/dataset";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type DatasetWithOrganization, updateDatasetSchema } from "@/types/dataset";

// Function to create schema with translations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createFormSchema = (t: any) => {
  return z.object({
    id: z.string().min(1),
    name: z.string().min(1, { message: t("form.name.errors.required") }),
    description: z.string(),
    updatedAt: z.date(),
  });
};

type FormValues = {
  id: string;
  name: string;
  description: string;
  updatedAt: Date;
};

type EditDatasetFormProps = {
  dataset: DatasetWithOrganization;
};

export function EditDatasetForm({ dataset }: EditDatasetFormProps) {
  const router = useRouter();
  const t = useTranslations("dataset");

  // Create schema with translations once when the component mounts
  const schema = useMemo(() => createFormSchema(t), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: dataset.datasets.id,
      name: dataset.datasets.name,
      description: dataset.datasets.description ?? "",
      updatedAt: new Date(),
    },
  });

  const onSubmit = async (formData: FormValues) => {
    const updateData = updateDatasetSchema.parse(formData);
    try {
      await update(dataset.datasets.id, updateData);
      toast.success(t("messages.updateSuccess"));
      router.push("/admin/datasets");
    } catch (error: unknown) {
      toast.error(t("messages.error.generic"));
      console.error(error);
      return;
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{t("form.name.label")}</FieldLabel>
            <FieldGroup>
              <Input
                {...field}
                id={field.name}
                placeholder={t("form.name.placeholder")}
                data-testid="admin.datasets.edit.form.name"
                aria-invalid={fieldState.invalid}
              />
            </FieldGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{t("form.description.label")}</FieldLabel>
            <FieldGroup>
              <Input
                {...field}
                id={field.name}
                placeholder={t("form.description.placeholder")}
                data-testid="admin.datasets.edit.form.description"
                aria-invalid={fieldState.invalid}
              />
            </FieldGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Field>
        <FieldLabel htmlFor="organization" className="flex items-center gap-2">
          {t("form.organization.label")}
          <Tooltip>
            <TooltipTrigger type="button" className="cursor-help">
              <InfoIcon className="text-muted-foreground h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("form.organization.helpText")}</p>
            </TooltipContent>
          </Tooltip>
        </FieldLabel>
        <FieldGroup>
          <Input
            id="organization"
            value={dataset.organizations.name}
            disabled
            className="bg-muted cursor-not-allowed"
            data-testid="admin.datasets.edit.form.organization"
          />
        </FieldGroup>
      </Field>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="cursor-pointer"
          data-testid="admin.datasets.edit.form.submit">
          {form.formState.isSubmitting ? t("form.submit.updating") : t("form.submit.update")}
        </Button>
      </div>
    </form>
  );
}
