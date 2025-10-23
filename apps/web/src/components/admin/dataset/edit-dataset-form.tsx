"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { update } from "@/actions/dataset";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type Dataset, updateDatasetSchema } from "@/types/dataset";

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
  dataset: Dataset;
};

export function EditDatasetForm({ dataset }: EditDatasetFormProps) {
  const router = useRouter();
  const t = useTranslations("dataset");

  // Create schema with translations once when the component mounts
  const schema = useMemo(() => createFormSchema(t), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description ?? "",
      updatedAt: new Date(),
    },
  });

  const onSubmit = async (formData: FormValues) => {
    const updateData = updateDatasetSchema.parse(formData);
    try {
      await update(dataset.id, updateData);
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
      <Field>
        <FieldLabel htmlFor="name">{t("form.name.label")}</FieldLabel>
        <FieldGroup>
          <Input
            id="name"
            placeholder={t("form.name.placeholder")}
            data-testid="admin.datasets.edit.form.name"
            aria-invalid={!!form.formState.errors.name}
            {...form.register("name")}
          />
        </FieldGroup>
        <FieldError errors={[form.formState.errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="description">{t("form.description.label")}</FieldLabel>
        <FieldGroup>
          <Input
            id="description"
            placeholder={t("form.description.placeholder")}
            data-testid="admin.datasets.edit.form.description"
            aria-invalid={!!form.formState.errors.description}
            {...form.register("description")}
          />
        </FieldGroup>
        <FieldError errors={[form.formState.errors.description]} />
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
