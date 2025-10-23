"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { update } from "@/actions/organization";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Organization, OrganizationSettings } from "@/types/organization";
import { createFormSchema } from "./defaults";
import { OrganizationSettingsEditor } from "./organization-settings-editor";

type FormSchema = ReturnType<typeof createFormSchema>;

type FormEditProps = {
  organization: Organization;
};

export function EditOrganizationForm({ organization }: FormEditProps) {
  const router = useRouter();
  const t = useTranslations();

  const form = useForm<z.infer<FormSchema>>({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
      settings: organization.settings,
    },
  });

  const updateSettings = (settings: OrganizationSettings) => {
    form.setValue("settings", settings);
  };

  const onSubmit = async (formData: z.infer<FormSchema>) => {
    try {
      await update(organization.id, formData);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Field>
          <FieldLabel htmlFor="name">{t("organization.form.name.label")}</FieldLabel>
          <FieldGroup>
            <Input
              id="name"
              placeholder={t("organization.form.name.placeholder")}
              data-testid="admin.organizations.edit.form.name"
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
              data-testid="admin.organizations.edit.form.slug"
              aria-invalid={!!form.formState.errors.slug}
              {...form.register("slug")}
            />
          </FieldGroup>
          <FieldDescription>{t("organization.form.slug.description")}</FieldDescription>
          <FieldError errors={[form.formState.errors.slug]} />
        </Field>
      </form>

      <div className="border-t pt-8">
        <OrganizationSettingsEditor initialSettings={organization.settings} onChangeAction={updateSettings} />
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
