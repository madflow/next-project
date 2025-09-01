"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { update, updateSettings } from "@/actions/organization";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { OrganizationSettingsEditor } from "./organization-settings-editor";

// Types for organization settings
type ThemeItem = {
  name: string;
  chartColors?: Record<string, string>;
};

type OrganizationSettings = {
  themes?: ThemeItem[];
};

// Default organization settings
const getDefaultOrganizationSettings = (): OrganizationSettings => ({
  themes: [
    {
      name: "Default",
      chartColors: {
        "chart-1": "#3b82f6",
        "chart-2": "#ef4444", 
        "chart-3": "#10b981",
        "chart-4": "#f59e0b",
        "chart-5": "#8b5cf6",
        "chart-6": "#ec4899",
      },
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createFormSchema = (t: any) =>
  z.object({
    name: z.string().min(1, {
      error: t("organization.form.name.errors.required"),
    }),
    slug: z
      .string()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, {
        error: t("organization.form.slug.errors.invalid"),
      })
      .min(1, {
        error: t("organization.form.slug.errors.required"),
      })
      .max(50, {
        error: t("organization.form.slug.errors.maxLength"),
      }),
    createdAt: z.date().optional(),
  });

type FormSchema = ReturnType<typeof createFormSchema>;
type FormValues = z.infer<FormSchema> & {
  id: string;
  settings?: OrganizationSettings;
};

type FormEditProps = {
  organization: FormValues;
};

export function EditOrganizationForm({ organization }: FormEditProps) {
  const router = useRouter();
  const t = useTranslations();
  const [settings, setSettings] = useState<OrganizationSettings>(
    organization.settings || getDefaultOrganizationSettings()
  );

  const form = useForm<z.infer<FormSchema>>({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
    },
  });

  const onSubmit = async (formData: z.infer<FormSchema>) => {
    try {
      // Update basic organization info
      await update(organization.id, formData);
      
      // Update organization settings
      await updateSettings(organization.id, settings);
      
      toast.success(t("organization.messages.updateSuccess"));
      router.push("/admin/organizations");
    } catch (error: unknown) {
      toast.error(t("organization.messages.error.duplicateSlug"));
      console.error(error);
      return;
    }
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("organization.form.name.label")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("organization.form.name.placeholder")}
                    data-testid="admin.organizations.edit.form.name"
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
                <FormLabel>{t("organization.form.slug.label")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("organization.form.slug.placeholder")}
                    data-testid="admin.organizations.edit.form.slug"
                  />
                </FormControl>
                <FormDescription>{t("organization.form.slug.description")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <div className="border-t pt-8">
        <OrganizationSettingsEditor
          initialSettings={settings}
          onChangeAction={setSettings}
        />
      </div>

      <div className="flex justify-start gap-4 border-t pt-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={form.formState.isSubmitting}
          className="cursor-pointer">
          {t("organization.form.cancel")}
        </Button>
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          className="cursor-pointer"
          data-testid="admin.organizations.edit.form.submit"
          disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {form.formState.isSubmitting ? t("organization.form.submit.updating") : t("organization.form.submit.update")}
        </Button>
      </div>
    </div>
  );
}
