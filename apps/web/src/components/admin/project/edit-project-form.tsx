"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { update } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProjectSchema } from "@/types/project";

type Organization = {
  id: string;
  name: string;
  slug: string;
};

// Base schema without translations
const baseSchema = {
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z
    .string()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/)
    .min(1)
    .max(50),
  organizationId: z.string().min(1),
  updatedAt: z.date(),
};

// Function to create schema with translations
const createFormSchema = (t: ReturnType<typeof useTranslations>) => {
  return z.object(baseSchema).superRefine((data, ctx) => {
    if (!data.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: t("form.name.errors.required"),
      });
    }
    if (!data.slug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slug"],
        message: t("form.slug.errors.required"),
      });
    } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slug"],
        message: t("form.slug.errors.invalid"),
      });
    } else if (data.slug.length > 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slug"],
        message: t("form.slug.errors.maxLength"),
      });
    }
    if (!data.organizationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["organizationId"],
        message: t("form.organization.errors.required"),
      });
    }
  });
};

type FormValues = z.infer<ReturnType<typeof createFormSchema>> & {
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.name.label")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("form.name.placeholder")}
                  data-testid="admin.projects.edit.form.name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.slug.label")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("form.slug.placeholder")}
                  data-testid="admin.projects.edit.form.slug"
                />
              </FormControl>
              <FormDescription>{t("form.slug.description")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="organizationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.organization.label")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="organization-select">
                <FormControl>
                  <SelectTrigger className="w-full sm:max-w-[50%]">
                    <SelectValue placeholder={t("form.organization.placeholder")} />
                  </SelectTrigger>
                </FormControl>
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
              <FormMessage />
            </FormItem>
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
    </Form>
  );
}
