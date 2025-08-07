"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { OrganizationSelect } from "@/components/form/organization-select";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("formLabels.email")}</FormLabel>
                <FormControl>
                  <Input
                    disabled={!!user}
                    type="email"
                    {...field}
                    placeholder={t("formPlaceholders.email")}
                    data-testid="admin.users.invite.form.email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("formLabels.role")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full sm:w-1/2 lg:w-1/3" data-testid="admin.users.invite.form.role">
                      <SelectValue placeholder={t("formPlaceholders.selectRole")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {!organizationId && (
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("formLabels.organization")}</FormLabel>
                  <OrganizationSelect onValueChangeAction={field.onChange} defaultValue={field.value} />
                  <FormMessage />
                </FormItem>
              )}
            />
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
    </Form>
  );
}
