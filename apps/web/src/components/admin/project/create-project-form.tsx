"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { create } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Organization } from "@/types/organization";
import { insertProjectSchema } from "@/types/project";

type CreateProjectTranslations = {
  (key: `form.${"name" | "slug" | "organization"}.errors.${"required" | "invalid" | "maxLength"}`): string;
};

const createFormSchema = (t: CreateProjectTranslations) =>
  z.object({
    name: z.string().min(1, {
      error: t("form.name.errors.required"),
    }),
    slug: z
      .string()
      .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
        error: t("form.slug.errors.invalid"),
      })
      .min(1, {
        error: t("form.slug.errors.required"),
      })
      .max(50, {
        error: t("form.slug.errors.maxLength"),
      }),
    organizationId: z.string().min(1, {
      error: t("form.organization.errors.required"),
    }),
    createdAt: z.date(),
  });

type FormValues = z.infer<ReturnType<typeof createFormSchema>> & {
  createdAt: Date;
};

export function CreateProjectForm() {
  const router = useRouter();
  const t = useTranslations("project");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    resolver: zodResolver(createFormSchema(t as unknown as CreateProjectTranslations)),
    defaultValues: {
      name: "",
      slug: "",
      organizationId: "",
      createdAt: new Date(),
    },
  });

  const onSubmit = async (formData: FormValues) => {
    const insertData = insertProjectSchema.parse(formData);
    try {
      await create(insertData);
      toast.success(t("messages.createSuccess"));
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
                data-testid="admin.projects.new.form.name"
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
                data-testid="admin.projects.new.form.slug"
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

      <div className="flex justify-start gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={form.formState.isSubmitting || isLoading}
          className="cursor-pointer">
          {t("form.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={form.formState.isSubmitting || isLoading || organizations.length === 0}
          className="cursor-pointer"
          data-testid="admin.projects.new.form.submit">
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {form.formState.isSubmitting ? t("form.submit.creating") : t("form.submit.create")}
        </Button>
      </div>
    </form>
  );
}
