"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { OrganizationSelect } from "@/components/form/organization-select";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { organization } from "@/lib/auth-client";
import { User } from "@/types/user";

type InviteFormTranslations = {
  (key: `validation.${"validEmailRequired" | "organizationRequired"}`): string;
  (key: `roles.${"member" | "admin" | "owner"}`): string;
};

const inviteFormSchema = (t: InviteFormTranslations) =>
  z.object({
    email: z.email({
      message: t("validation.validEmailRequired"),
    }),
    role: z.enum(["member", "admin", "owner"]).default("member"),
    organizationId: z.string().min(1, {
      message: t("validation.organizationRequired"),
    }),
  });

type FormValues = z.infer<ReturnType<typeof inviteFormSchema>>;

type Role = {
  value: string;
  label: string;
};

const getRoles = (t: InviteFormTranslations): Role[] => [
  { value: "member", label: t("roles.member") },
  { value: "admin", label: t("roles.admin") },
  { value: "owner", label: t("roles.owner") },
];

type InviteUserFormProps = {
  user?: User;
  organizationId?: string;
};

export function InviteUserForm({ user, organizationId }: InviteUserFormProps) {
  const t = useTranslations("adminUserInviteForm");
  const roles = getRoles(t as unknown as InviteFormTranslations);

  const form = useForm<FormValues>({
    resolver: zodResolver(inviteFormSchema(t as unknown as InviteFormTranslations)) as unknown as Resolver<FormValues>,
    defaultValues: {
      email: user ? user.email : "",
      role: "member" as const,
      organizationId: organizationId ?? "",
    },
  });

  const onSubmit = async (formData: FormValues) => {
    try {
      const { error } = await organization.inviteMember({
        email: formData.email,
        role: formData.role,
        organizationId: formData.organizationId,
        resend: true,
      });

      if (error) {
        toast.error(t("messages.inviteError"));
        console.error(error);
        return;
      }

      toast.success(t("messages.inviteSuccess"));
      form.reset();
    } catch (error) {
      toast.error(t("messages.inviteError"));
      console.error(error);
      return;
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email">{t("formLabels.email")}</FieldLabel>
              <FieldGroup>
                <Input
                  id="email"
                  disabled={!!user}
                  type="email"
                  placeholder={t("formPlaceholders.email")}
                  aria-invalid={fieldState.invalid}
                  {...field}
                  data-testid="admin.users.invite.form.email"
                />
              </FieldGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="role"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="role">{t("formLabels.role")}</FieldLabel>
              <FieldGroup>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="role"
                    className="w-full sm:w-1/2 lg:w-1/3"
                    data-testid="admin.users.invite.form.role">
                    <SelectValue placeholder={t("formPlaceholders.selectRole")} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
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

        {!organizationId && (
          <Field>
            <FieldLabel>{t("formLabels.organization")}</FieldLabel>
            <FieldGroup>
              <OrganizationSelect
                onValueChangeAction={(value) => form.setValue("organizationId", value)}
                defaultValue={form.watch("organizationId")}
              />
            </FieldGroup>
            <FieldError errors={[form.formState.errors.organizationId]} />
          </Field>
        )}
      </div>
      <div className="flex justify-start gap-4">
        <Button type="submit" disabled={form.formState.isSubmitting} data-testid="admin.users.invite.form.submit">
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("buttons.sending")}
            </>
          ) : (
            t("buttons.sendInvitation")
          )}
        </Button>
      </div>
    </form>
  );
}
