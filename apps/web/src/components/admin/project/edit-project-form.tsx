"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { update } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProjectSchema } from "@/types/project";

type Organization = {
  id: string;
  name: string;
  slug: string;
};

// Function to create schema with translations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createFormSchema = (t: any) => {
  return z.object({
    id: z.string().min(1),
    name: z.string().min(1, { message: t("form.name.errors.required") }),
    slug: z
      .string()
      .toLowerCase()
      .min(1, { message: t("form.slug.errors.required") })
      .max(50, { message: t("form.slug.errors.maxLength") })
      .regex(/^[a-z0-9-]+$/, { message: t("form.slug.errors.invalid") }),
    organizationId: z.string().min(1, { message: t("form.organization.errors.required") }),
    updatedAt: z.date(),
  });
};

type FormValues = {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
  updatedAt: Date;
};

type EditProjectFormProps = {
  project: {
    id: string;
    name: string;
    slug: string;
    organizationId: string;
  };
};

export function EditProjectForm({ project }: EditProjectFormProps) {
  const router = useRouter();
  const t = useTranslations("project");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create schema with translations once when the component mounts
  const schema = useMemo(() => createFormSchema(t), [t]);

  useEffect(() => {
    async function loadOrganizations() {
      try {
        const result = await fetch("/api/organizations").then((res) => res.json());
        setOrganizations(result.rows);
      } catch (error) {
        console.error("Failed to load organizations", error);
        toast.error(t("messages.error.generic"));
      } finally {
        setIsLoading(false);
      }
    }
    loadOrganizations();
  }, [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: project.id,
      name: project.name,
      slug: project.slug,
      organizationId: project.organizationId,
      updatedAt: new Date(),
    },
  });

  const onSubmit = async (formData: FormValues) => {
    const updateData = updateProjectSchema.parse(formData);
    try {
      await update(project.id, updateData);
      toast.success(t("messages.updateSuccess"));
      router.push("/admin/projects");
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
                data-testid="admin.projects.edit.form.name"
                aria-invalid={fieldState.invalid}
              />
            </FieldGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="slug"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{t("form.slug.label")}</FieldLabel>
            <FieldGroup>
              <Input
                {...field}
                id={field.name}
                placeholder={t("form.slug.placeholder")}
                data-testid="admin.projects.edit.form.slug"
                aria-invalid={fieldState.invalid}
              />
            </FieldGroup>
            <FieldDescription>{t("form.slug.description")}</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="organizationId"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{t("form.organization.label")}</FieldLabel>
            <FieldGroup>
              <Select onValueChange={field.onChange} value={field.value} data-testid="organization-select">
                <SelectTrigger id={field.name} className="w-full sm:max-w-[50%]">
                  <SelectValue placeholder={t("form.organization.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="text-muted-foreground px-2 py-1.5 text-sm">{t("form.organization.loading")}</div>
                  ) : organizations.length === 0 ? (
                    <div className="text-muted-foreground px-2 py-1.5 text-sm">{t("form.organization.notFound")}</div>
                  ) : (
                    organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id} data-testid={`org-option-${org.slug}`}>
                        {org.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FieldGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="pt-2">
        <Button
          type="submit"
          disabled={form.formState.isSubmitting || isLoading || organizations.length === 0}
          className="cursor-pointer"
          data-testid="admin.projects.edit.form.submit">
          {form.formState.isSubmitting ? t("form.submit.updating") : t("form.submit.update")}
        </Button>
      </div>
    </form>
  );
}
