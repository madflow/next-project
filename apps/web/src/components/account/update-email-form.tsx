"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { changeEmail, useSession } from "@/lib/auth-client";

const emailFormSchema = z.object({
  email: z.email({
    error: "Please enter a valid email address.",
  }),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

export function UpdateEmailForm() {
  const t = useTranslations();
  const { data: session } = useSession();

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: EmailFormValues) => {
    if (data.email !== session?.user?.email) {
      await changeEmail({
        newEmail: data.email,
        callbackURL: "/user/account",
        fetchOptions: {
          onError: () => {
            toast.error(t("account.profile.emailChangeError"));
          },
          onSuccess: () => {
            form.reset();
            toast.success(t("account.profile.emailChangeSent"));
          },
        },
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("account.profile.fields.currentEmail")}</p>
          <p className="text-muted-foreground text-sm">{session?.user?.email}</p>
        </div>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("account.profile.fields.newEmail")}</FieldLabel>
              <FieldGroup>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  placeholder={t("account.profile.fields.newEmailPlaceholder")}
                  aria-invalid={fieldState.invalid}
                  data-testid="app.user.account.email"
                />
              </FieldGroup>
              <FieldDescription>{t("account.profile.emailChangeNotice")}</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <Button type="submit" className="cursor-pointer" data-testid="app.user.account.email.update">
        {t("account.profile.fields.updateEmail")}
      </Button>
    </form>
  );
}
