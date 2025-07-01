"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { create } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Organization } from "@/types/organization";
import { insertProjectSchema } from "@/types/project";

const createFormSchema = (t: ReturnType<typeof useTranslations>) =>
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
    resolver: zodResolver(createFormSchema(t)),
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.name.label")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t("form.name.placeholder")} data-testid="admin.projects.new.form.name" />
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
                <Input {...field} placeholder={t("form.slug.placeholder")} data-testid="admin.projects.new.form.slug" />
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
            data-testid="admin.projects.new.form.submit">
            {form.formState.isSubmitting ? t("form.submit.creating") : t("form.submit.create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
