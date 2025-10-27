"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Locale, locales } from "@/i18n/config";
import { updateUser, useSession } from "@/lib/auth-client";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";

const nameFormSchema = z.object({
  name: z.string().min(2, {
    error: "Name must be at least 2 characters.",
  }),
  locale: z.enum(locales).optional(),
});

type ProfileFormValues = z.infer<typeof nameFormSchema>;

export function UpdateProfileForm() {
  const t = useTranslations();
  const { data: session } = useSession();
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: {
      name: "",
      locale: session?.user?.locale as Locale,
    },
  });

  // Update form default values when session is available
  useEffect(() => {
    if (session) {
      const values: ProfileFormValues = {
        name: session.user.name,
      };
      if (session.user.locale) {
        values.locale = session.user.locale as Locale;
      }
      form.reset(values);
    }
  }, [session, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (data.name !== session?.user?.name || data.locale !== session?.user?.locale) {
      await updateUser({
        name: data.name,
        locale: data.locale,
        fetchOptions: {
          onError: () => {
            toast.error(t("account.profile.error"));
          },
          onSuccess: () => {
            toast.success(t("account.profile.success"));
            router.refresh();
          },
        },
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("account.profile.fields.name")}</FieldLabel>
              <FieldGroup>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  data-testid="app.user.account.profile.name"
                />
              </FieldGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="locale"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("account.profile.fields.locale")}</FieldLabel>
              <FieldGroup>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    data-testid="app.user.account.profile.locale">
                    <SelectValue placeholder={t("localeSwitcher.selectLanguage")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t("localeSwitcher.locale")}</SelectLabel>
                      <SelectItem value="en">{t("localeSwitcher.languages.en")}</SelectItem>
                      <SelectItem value="de">{t("localeSwitcher.languages.de")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FieldGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <Button type="submit" className="cursor-pointer" data-testid="app.user.account.profile.update">
        {t("account.profile.fields.updateProfile")}
      </Button>
    </form>
  );
}
