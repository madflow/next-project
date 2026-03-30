"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { update } from "@/actions/user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Locale, locales } from "@/i18n/config";
import { type User } from "@/types/user";

type EditUserTranslations = {
  (key: `validation.${"nameRequired" | "validEmailRequired" | "roleRequired"}`): string;
  (key: `roles.${"user" | "admin"}`): string;
};

const createFormSchema = (t: EditUserTranslations) =>
  z.object({
    name: z.string().min(1, { message: t("validation.nameRequired") }),
    email: z.string().email({ message: t("validation.validEmailRequired") }),
    role: z.string().min(1, { message: t("validation.roleRequired") }),
    locale: z.enum(locales).optional(),
  });

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

type FormEditProps = {
  user: Pick<User, "id" | "name" | "email" | "role" | "locale" | "emailVerified">;
};

type Role = {
  value: string;
  label: string;
};

type Language = {
  value: Locale;
  label: string;
};

const getRoles = (t: EditUserTranslations): Role[] => [
  { value: "user", label: t("roles.user") },
  { value: "admin", label: t("roles.admin") },
];

const getLanguages = (t: (key: `languages.${Locale}`) => string): Language[] =>
  locales.map((locale) => ({
    value: locale,
    label: t(`languages.${locale}`),
  }));

export function EditUserForm({ user }: FormEditProps) {
  const router = useRouter();
  const t = useTranslations("adminUserEditForm");
  const tLocale = useTranslations("localeSwitcher");
  const languages = getLanguages(tLocale);

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(t as unknown as EditUserTranslations)),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role || "user",
      locale: user.locale ? (user.locale as Locale) : undefined,
    },
  });

  const onSubmit = async (formData: FormValues) => {
    try {
      await update(user.id, formData);
      toast.success(t("messages.updateSuccess"));
      router.push("/admin/users");
    } catch (error: unknown) {
      toast.error(t("messages.updateFailed"));
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
            <FieldLabel htmlFor={field.name}>{t("formLabels.name")}</FieldLabel>
            <FieldGroup>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                data-testid="admin.users.edit.form.name"
              />
            </FieldGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{t("formLabels.email")}</FieldLabel>
            <FieldGroup>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                data-testid="admin.users.edit.form.email"
              />
            </FieldGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Field>
        <FieldLabel>{t("formLabels.emailVerified")}</FieldLabel>
        <FieldGroup>
          <Badge
            variant={user.emailVerified ? "default" : "secondary"}
            className="w-fit"
            data-testid="admin.users.edit.form.email-verified">
            {user.emailVerified ? t("emailVerification.verified") : t("emailVerification.notVerified")}
          </Badge>
        </FieldGroup>
      </Field>
      <Controller
        name="role"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{t("formLabels.role")}</FieldLabel>
            <FieldGroup>
              <Select value={field.value} onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger
                  id={field.name}
                  className="w-full sm:w-1/2 lg:w-1/3"
                  aria-invalid={fieldState.invalid}
                  data-testid="admin.users.edit.form.role">
                  <SelectValue placeholder={t("formPlaceholders.selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  {getRoles(t as unknown as EditUserTranslations).map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <FieldLabel htmlFor={field.name}>{t("formLabels.language")}</FieldLabel>
            <FieldGroup>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={field.name}
                  className="w-full sm:w-1/2 lg:w-1/3"
                  aria-invalid={fieldState.invalid}
                  data-testid="admin.users.edit.form.locale">
                  <SelectValue placeholder={t("formPlaceholders.selectLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.value} value={language.value}>
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/users")}
          disabled={form.formState.isSubmitting}
          className="cursor-pointer">
          {t("buttons.cancel")}
        </Button>
        <Button
          type="submit"
          className="cursor-pointer"
          data-testid="admin.users.edit.form.submit"
          disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("buttons.updating") : t("buttons.update")}
        </Button>
      </div>
    </form>
  );
}
