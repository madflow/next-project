"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { update } from "@/actions/organization";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

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
};

type FormEditProps = {
  organization: FormValues;
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
    },
  });

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
        <Button
          type="submit"
          className="cursor-pointer"
          data-testid="admin.organizations.edit.form.submit"
          disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("organization.form.submit.updating") : t("organization.form.submit.update")}
        </Button>
      </form>
    </Form>
  );
}
