"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { insertOrganizationSchema } from "@/types/organization";
import { create } from "@/actions/organization";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createFormSchema = (t: any) =>
  z.object({
    name: z.string().min(1, {
      error: t("organization.form.name.errors.required"),
    }),
    slug: z
      .string()
      .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
        error: t("organization.form.slug.errors.invalid"),
      })
      .min(1, {
        error: t("organization.form.slug.errors.required"),
      })
      .max(50, {
        error: t("organization.form.slug.errors.maxLength"),
      }),
    createdAt: z.date(),
  });

type FormValues = z.infer<ReturnType<typeof createFormSchema>> & {
  createdAt: Date;
};

export function CreateOrganizationForm() {
  const router = useRouter();
  const t = useTranslations();

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      name: "",
      slug: "",
      createdAt: new Date(),
    },
  });

  const onSubmit = async (formData: FormValues) => {
    const insertData = insertOrganizationSchema.parse(formData);
    try {
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
                  data-testid="admin.organizations.new.form.name"
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
                  data-testid="admin.organizations.new.form.slug"
                />
              </FormControl>
              <FormDescription>{t("organization.form.slug.description")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-start gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={form.formState.isSubmitting}
            className="cursor-pointer">
            {t("organization.form.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="cursor-pointer"
            data-testid="admin.organizations.new.form.submit">
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {form.formState.isSubmitting ? t("organization.form.submit.creating") : t("organization.form.submit.create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
