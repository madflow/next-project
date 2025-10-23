"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { create } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateUserTranslations = {
  (key: `validation.${"nameRequired" | "validEmailRequired"}`): string;
  (key: `roles.${"user" | "admin"}`): string;
};

const createFormSchema = (t: CreateUserTranslations) =>
  z.object({
    name: z.string().min(1, {
      message: t("validation.nameRequired"),
    }),
    email: z.email({
      message: t("validation.validEmailRequired"),
    }),
    role: z.enum(["user", "admin"]).default("user"),
  });

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

type Role = {
  value: string;
  label: string;
};

const getRoles = (t: CreateUserTranslations): Role[] => [
  { value: "user", label: t("roles.user") },
  { value: "admin", label: t("roles.admin") },
];

export function CreateUserForm() {
  const router = useRouter();
  const t = useTranslations("adminUserCreateForm");
  const roles = getRoles(t as unknown as CreateUserTranslations);

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(t as unknown as CreateUserTranslations)) as unknown as Resolver<FormValues>,
    defaultValues: {
      name: "",
      email: "",
      role: "user" as const,
    },
  });

  const onSubmit = async (formData: FormValues) => {
    try {
      await create({
        ...formData,
        emailVerified: false,
        banned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
        banReason: null,
        banExpires: null,
      });
      toast.success(t("messages.createSuccess"));
      router.push("/admin/users");
    } catch (error) {
      toast.error(t("messages.createError"));
      console.error(error);
      return;
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <Field>
          <FieldLabel htmlFor="name">{t("formLabels.name")}</FieldLabel>
          <FieldGroup>
            <Input
              id="name"
              placeholder={t("formPlaceholders.name")}
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
              data-testid="admin.users.new.form.name"
            />
          </FieldGroup>
          <FieldError errors={[form.formState.errors.name]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">{t("formLabels.email")}</FieldLabel>
          <FieldGroup>
            <Input
              id="email"
              type="email"
              placeholder={t("formPlaceholders.email")}
              aria-invalid={!!form.formState.errors.email}
              {...form.register("email")}
              data-testid="admin.users.new.form.email"
            />
          </FieldGroup>
          <FieldError errors={[form.formState.errors.email]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="role">{t("formLabels.role")}</FieldLabel>
          <FieldGroup>
            <Select
              value={form.watch("role")}
              onValueChange={(value) => form.setValue("role", value as "user" | "admin")}
              defaultValue={form.getValues("role")}
            >
              <SelectTrigger
                id="role"
                className="w-full sm:w-1/2 lg:w-1/3"
                aria-invalid={!!form.formState.errors.role}
                data-testid="admin.users.new.form.role"
              >
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
          <FieldError errors={[form.formState.errors.role]} />
        </Field>
      </div>
      <div className="flex justify-start gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={form.formState.isSubmitting}>
          {t("buttons.cancel")}
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting} data-testid="admin.users.new.form.submit">
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("buttons.saving")}
            </>
          ) : (
            t("buttons.save")
          )}
        </Button>
      </div>
    </form>
  );
}
