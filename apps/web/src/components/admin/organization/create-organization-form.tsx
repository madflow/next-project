"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { create } from "@/actions/organization";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type OrganizationSettings, insertOrganizationSchema } from "@/types/organization";
import { createFormSchema } from "./defaults";
import { OrganizationSettingsEditor } from "./organization-settings-editor";

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

export function CreateOrganizationForm() {
  const router = useRouter();
  const t = useTranslations();

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      name: "",
      slug: "",
      createdAt: new Date(),
      settings: null,
    },
  });

  const updateSettings = (settings: OrganizationSettings) => {
    form.setValue("settings", settings);
  };

  const onSubmit = async (formData: FormValues) => {
    const insertData = insertOrganizationSchema.parse(formData);
    try {
      // Create the organization first
      await create(insertData);
      toast.success(t("organization.messages.createSuccess"));
      router.push("/admin/organizations");
    } catch (error: unknown) {
      toast.error(t("organization.messages.error.generic"));
      console.error(error);
      return;
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Field>
          <FieldLabel htmlFor="name">{t("organization.form.name.label")}</FieldLabel>
          <FieldGroup>
            <Input
              id="name"
              placeholder={t("organization.form.name.placeholder")}
              data-testid="admin.organizations.new.form.name"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
          </FieldGroup>
          <FieldError errors={[form.formState.errors.name]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="slug">{t("organization.form.slug.label")}</FieldLabel>
          <FieldGroup>
            <Input
              id="slug"
              placeholder={t("organization.form.slug.placeholder")}
              data-testid="admin.organizations.new.form.slug"
              aria-invalid={!!form.formState.errors.slug}
              {...form.register("slug")}
            />
          </FieldGroup>
          <FieldDescription>{t("organization.form.slug.description")}</FieldDescription>
          <FieldError errors={[form.formState.errors.slug]} />
        </Field>
      </form>

      <div className="border-t pt-8">
        <OrganizationSettingsEditor initialSettings={form.getValues("settings")} onChangeAction={updateSettings} />
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
          disabled={form.formState.isSubmitting}
          className="cursor-pointer"
          data-testid="admin.organizations.new.form.submit">
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {form.formState.isSubmitting ? t("organization.form.submit.creating") : t("organization.form.submit.create")}
        </Button>
      </div>
    </div>
  );
}
